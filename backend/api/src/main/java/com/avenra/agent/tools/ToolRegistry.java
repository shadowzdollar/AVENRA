package com.avenra.agent.tools;

import com.avenra.agent.domain.Risk;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** The closed catalogue (ADR-033). CRITICAL tools are refused at startup: agents never get them. */
@Component
public class ToolRegistry {

    private final Map<String, Tool<?>> tools = new LinkedHashMap<>();

    ToolRegistry(List<Tool<?>> declared) {
        for (Tool<?> tool : declared) {
            if (tool.risk() == Risk.CRITICAL) {
                throw new IllegalStateException("critical tools are not available to agents: " + tool.name());
            }
            if (tools.putIfAbsent(tool.name(), tool) != null) {
                throw new IllegalStateException("duplicate tool " + tool.name());
            }
        }
    }

    public Optional<Tool<?>> find(String name) {
        return Optional.ofNullable(tools.get(name));
    }

    public List<String> names() {
        return List.copyOf(tools.keySet());
    }
}
