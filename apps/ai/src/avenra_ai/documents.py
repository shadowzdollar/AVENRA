"""Text of an uploaded document, page by page (ADR-031).

Only files already scanned clean by the API arrive here. PDF parsing is still bounded: a page
limit and a time limit, so a crafted file cannot hold the service.
"""

import asyncio
import io
import logging
from dataclasses import dataclass

from pypdf import PdfReader
from pypdf.errors import PyPdfError

from avenra_ai.providers.base import ErrorCode, ProviderError

MAX_PDF_PAGES = 200
PDF_TEXT_SECONDS = 20.0
# A PDF with less text than this per page is treated as scanned and sent as a file.
MIN_CHARS_PER_PAGE = 40

log = logging.getLogger("avenra_ai.documents")


@dataclass(frozen=True)
class DocumentText:
    """The text of each page, in order. Plain text files are one page."""

    pages: tuple[str, ...]

    @property
    def full(self) -> str:
        return "\n".join(self.pages)


async def extract_text(media_type: str, data: bytes) -> DocumentText | None:
    """The document's text, or `None` when it has no usable text layer (images, scans)."""
    match media_type:
        case "text/plain" | "text/csv":
            return DocumentText(pages=(data.decode("utf-8", errors="replace"),))
        case "application/pdf":
            try:
                pages = await asyncio.wait_for(asyncio.to_thread(_pdf_pages, data), PDF_TEXT_SECONDS)
            except TimeoutError as error:
                raise ProviderError(ErrorCode.UNREADABLE_DOCUMENT, "the PDF took too long to read") from error
            meaningful = sum(len(page.strip()) for page in pages)
            if not pages or meaningful < MIN_CHARS_PER_PAGE * len(pages):
                return None
            return DocumentText(pages=tuple(pages))
        case _:
            return None


def _pdf_pages(data: bytes) -> list[str]:
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise ProviderError(ErrorCode.UNREADABLE_DOCUMENT, "the PDF is encrypted")
        if len(reader.pages) > MAX_PDF_PAGES:
            raise ProviderError(ErrorCode.UNREADABLE_DOCUMENT, f"the PDF has more than {MAX_PDF_PAGES} pages")
        return [page.extract_text() or "" for page in reader.pages]
    except PyPdfError as error:
        log.info("PDF could not be parsed", extra={"error": {"type": type(error).__name__}})
        raise ProviderError(ErrorCode.UNREADABLE_DOCUMENT, "the PDF could not be read") from error
