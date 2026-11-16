////////////////////////////////////////////////////////////////////////////////
// 🛑 Nothing in here has anything to do with Nextjs, it's just a fake database
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter'; // For filtering

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Define the shape of Work Engagement data
export type Product = {
  photo_url?: string;
  name: string;
  client?: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  status?: string;
  priority?: string;
  completeness?: string;
  openExceptions?: number;
  updated_at: string;
};

const avenraEngagements = [
  {
    name: 'ENG-2026-001: FY2025 S-Corp Form 1120-S & K-1s',
    client: 'Apex Holdings Inc',
    category: 'Tax Compliance & Returns',
    description: 'Federal and state corporate tax preparation, schedule M-1 reconciliation, and shareholder K-1 distribution.',
    price: 4500,
    status: 'RUNNING',
    priority: 'HIGH',
    completeness: '8/10 (80%)',
    openExceptions: 1
  },
  {
    name: 'ENG-2026-002: SOC-2 Type II Trust Services Verification',
    client: 'Meridian BioSciences Inc',
    category: 'Audit & Attestation',
    description: 'Security, availability, and confidentiality control verification with automated audit evidence hashing.',
    price: 18500,
    status: 'COMPLETED',
    priority: 'NORMAL',
    completeness: '12/12 (100%)',
    openExceptions: 0
  },
  {
    name: 'ENG-2026-003: Q3 Cross-Border Reverse-Charge VAT Audit',
    client: 'Vanguard Logistics Ltd',
    category: 'Sales & VAT Filings',
    description: 'Reconciliation of customs declarations and EU reverse-charge invoices against SAP general ledger.',
    price: 6800,
    status: 'WAITING_FOR_INFORMATION',
    priority: 'URGENT',
    completeness: '4/8 (50%)',
    openExceptions: 2
  },
  {
    name: 'ENG-2026-004: Series B Pre-Audit Financial Due Diligence',
    client: 'Nova Dynamics Tech',
    category: 'Advisory & Due Diligence',
    description: 'Quality of earnings analysis, historical EBITDA normalization, and debt schedule audit.',
    price: 24000,
    status: 'WAITING_FOR_APPROVAL',
    priority: 'HIGH',
    completeness: '15/16 (94%)',
    openExceptions: 0
  },
  {
    name: 'ENG-2026-005: Form 941 Quarterly Payroll & W-2 Audit',
    client: 'Starlight Renewable Energy LLC',
    category: 'Payroll & KYC',
    description: 'Multi-state payroll tax return verification, federal withholding checks, and 941 reconciliation.',
    price: 3200,
    status: 'COMPLETED',
    priority: 'NORMAL',
    completeness: '6/6 (100%)',
    openExceptions: 0
  },
  {
    name: 'ENG-2026-006: Beneficial Ownership (UBO) AML Filing',
    client: 'Helios Capital Partners',
    category: 'Payroll & KYC',
    description: 'FinCEN beneficial ownership report, passport/ID verification, and corporate tree attestation.',
    price: 2900,
    status: 'RUNNING',
    priority: 'NORMAL',
    completeness: '5/7 (71%)',
    openExceptions: 0
  },
  {
    name: 'ENG-2026-007: Section 41 R&D Tax Credit Substantiation',
    client: 'Quantum Robotics Corp',
    category: 'Tax Compliance & Returns',
    description: 'Four-part test evaluation, engineer wage allocation, and contemporaneous evidence validation.',
    price: 14500,
    status: 'BLOCKED',
    priority: 'URGENT',
    completeness: '3/9 (33%)',
    openExceptions: 3
  },
  {
    name: 'ENG-2026-008: Annual Statutory Financial Audit FY2025',
    client: 'Northwind Health Systems',
    category: 'Audit & Attestation',
    description: 'Full GAAP financial statement audit, inventory count verification, and internal control testing.',
    price: 32000,
    status: 'RUNNING',
    priority: 'HIGH',
    completeness: '18/24 (75%)',
    openExceptions: 1
  },
  {
    name: 'ENG-2026-009: 1099-NEC & 1099-MISC Annual Information Return',
    client: 'Summit Creative Collective',
    category: 'Tax Compliance & Returns',
    description: 'Automated TIN matching with IRS FIRE system, backup withholding checks, and contractor filing.',
    price: 1800,
    status: 'COMPLETED',
    priority: 'LOW',
    completeness: '10/10 (100%)',
    openExceptions: 0
  },
  {
    name: 'ENG-2026-010: Multi-Jurisdiction Nexus & Sales Tax Review',
    client: 'E-Commerce Global Direct',
    category: 'Sales & VAT Filings',
    description: 'Economic nexus threshold analysis across 45 states and marketplace facilitator exemption review.',
    price: 5400,
    status: 'WAITING_FOR_INFORMATION',
    priority: 'NORMAL',
    completeness: '7/12 (58%)',
    openExceptions: 1
  },
  {
    name: 'ENG-2026-011: ASC-606 Revenue Recognition Contract Audit',
    client: 'CloudScale SaaS Platform',
    category: 'Audit & Attestation',
    description: 'Five-step revenue recognition model validation across 200+ enterprise master service agreements.',
    price: 16000,
    status: 'RUNNING',
    priority: 'HIGH',
    completeness: '11/15 (73%)',
    openExceptions: 0
  },
  {
    name: 'ENG-2026-012: Post-Merger Accounting Systems Integration',
    client: 'OmniCorp Industrial Solutions',
    category: 'Advisory & Due Diligence',
    description: 'Chart of accounts unification, opening balance sheet harmonization, and closing ledger sign-off.',
    price: 28500,
    status: 'DRAFT',
    priority: 'LOW',
    completeness: '2/14 (14%)',
    openExceptions: 0
  }
];

function generateEngagementData(id: number): Product {
  const template = avenraEngagements[(id - 1) % avenraEngagements.length];
  const suffix = id > avenraEngagements.length ? ` #${Math.floor(id / avenraEngagements.length) + 1}` : '';

  return {
    id,
    name: `${template.name}${suffix}`,
    client: template.client,
    description: template.description,
    created_at: faker.date.between({ from: '2025-01-01', to: '2026-03-31' }).toISOString(),
    price: template.price,
    photo_url: `https://api.slingacademy.com/public/sample-products/${id}.png`,
    category: template.category,
    status: template.status,
    priority: template.priority,
    completeness: template.completeness,
    openExceptions: template.openExceptions,
    updated_at: faker.date.recent().toISOString()
  };
}

// Mock product data store
export const fakeProducts = {
  records: [] as Product[], // Holds the list of product objects

  // Initialize with sample data
  initialize() {
    const sampleProducts: Product[] = [];
    for (let i = 1; i <= 24; i++) {
      sampleProducts.push(generateEngagementData(i));
    }

    this.records = sampleProducts;
  },

  // Get all products with optional category filtering and search
  async getAll({ categories = [], search }: { categories?: string[]; search?: string }) {
    let products = [...this.records];

    // Filter products based on selected categories
    if (categories.length > 0) {
      products = products.filter((product) => categories.includes(product.category));
    }

    // Search functionality across multiple fields
    if (search) {
      products = matchSorter(products, search, {
        keys: ['name', 'client', 'description', 'category']
      });
    }

    return products;
  },

  // Get paginated results with optional category filtering, search, and sorting
  async getProducts({
    page = 1,
    limit = 10,
    categories,
    search,
    sort
  }: {
    page?: number;
    limit?: number;
    categories?: string | string[];
    search?: string;
    sort?: string;
  }) {
    await delay(1000);
    const categoriesArray = categories
      ? Array.isArray(categories)
        ? categories
        : String(categories).split(/[.,]/)
      : [];
    const allProducts = await this.getAll({
      categories: categoriesArray,
      search
    });

    // Sorting
    if (sort) {
      try {
        const sortItems = JSON.parse(sort) as {
          id: string;
          desc: boolean;
        }[];
        if (sortItems.length > 0) {
          const { id, desc } = sortItems[0];
          allProducts.sort((a, b) => {
            const aVal = (a as Record<string, unknown>)[id];
            const bVal = (b as Record<string, unknown>)[id];
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return desc ? bVal - aVal : aVal - bVal;
            }
            const aStr = String(aVal ?? '').toLowerCase();
            const bStr = String(bVal ?? '').toLowerCase();
            return desc ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
          });
        }
      } catch {
        // Invalid sort param — ignore
      }
    }

    const totalProducts = allProducts.length;

    // Pagination logic
    const offset = (page - 1) * limit;
    const paginatedProducts = allProducts.slice(offset, offset + limit);

    // Mock current time
    const currentTime = new Date().toISOString();

    // Return paginated response
    return {
      success: true,
      time: currentTime,
      message: 'Sample data for testing and learning purposes',
      total_products: totalProducts,
      offset,
      limit,
      products: paginatedProducts
    };
  },

  // Get a specific product by its ID
  async getProductById(id: number) {
    await delay(3000); // Simulate a slow API call

    // Find the product by its ID
    const product = this.records.find((product) => product.id === id);

    if (!product) {
      return {
        success: false,
        message: `Product with ID ${id} not found`
      };
    }

    // Mock current time
    const currentTime = new Date().toISOString();

    return {
      success: true,
      time: currentTime,
      message: `Product with ID ${id} found`,
      product
    };
  },

  // Create a new product
  async createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'photo_url'>) {
    await delay(1000);

    const newProduct: Product = {
      ...data,
      id: this.records.length + 1,
      photo_url: `https://api.slingacademy.com/public/sample-products/${this.records.length + 1}.png`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.records.push(newProduct);

    return {
      success: true,
      message: 'Product created successfully',
      product: newProduct
    };
  },

  // Update an existing product
  async updateProduct(
    id: number,
    data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'photo_url'>
  ) {
    await delay(1000);

    const index = this.records.findIndex((product) => product.id === id);

    if (index === -1) {
      return {
        success: false,
        message: `Product with ID ${id} not found`
      };
    }

    this.records[index] = {
      ...this.records[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    return {
      success: true,
      message: 'Product updated successfully',
      product: this.records[index]
    };
  },

  // Delete a product
  async deleteProduct(id: number) {
    await delay(1000);

    const index = this.records.findIndex((product) => product.id === id);

    if (index === -1) {
      return { success: false, message: `Product with ID ${id} not found` };
    }

    this.records.splice(index, 1);

    return {
      success: true,
      message: 'Product deleted successfully'
    };
  }
};

// Initialize sample products
fakeProducts.initialize();
