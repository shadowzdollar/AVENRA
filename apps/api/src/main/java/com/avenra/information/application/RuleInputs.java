package com.avenra.information.application;

import com.avenra.contract.v1.model.VerificationRule;
import com.avenra.contract.v1.model.VerificationRuleInput;
import com.avenra.verification.domain.Rule;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.jspecify.annotations.Nullable;

/** Rules between the contract and the verification domain. */
final class RuleInputs {

    private RuleInputs() {}

    static List<Rule> from(@Nullable List<VerificationRuleInput> inputs) {
        if (inputs == null) {
            return List.of();
        }
        return inputs.stream().map(RuleInputs::from).toList();
    }

    static Rule from(VerificationRuleInput input) {
        return new Rule(
                null,
                Rule.Type.valueOf(input.getType().getValue()),
                Rule.Severity.valueOf(input.getSeverity().getValue()),
                input.getMessage().strip(),
                input.getPattern(),
                input.getMinLength(),
                input.getMaxLength(),
                input.getValues() == null ? List.of() : input.getValues(),
                decimal(input.getMin()),
                decimal(input.getMax()),
                input.getNotBefore(),
                input.getNotAfter(),
                input.getMinDaysFromToday(),
                input.getMaxDaysFromToday(),
                input.getOtherRequirementId(),
                input.getOrder() == null
                        ? null
                        : Rule.Order.valueOf(input.getOrder().getValue()),
                input.getContentTypes() == null ? List.of() : input.getContentTypes(),
                input.getMaxBytes());
    }

    static VerificationRule toApi(Rule rule) {
        var api = new VerificationRule(
                        rule.id(),
                        com.avenra.contract.v1.model.RuleType.fromValue(
                                rule.type().name()),
                        com.avenra.contract.v1.model.RuleSeverity.fromValue(
                                rule.severity().name()),
                        rule.message())
                .pattern(rule.pattern())
                .minLength(rule.minLength())
                .maxLength(rule.maxLength())
                .min(rule.min() == null ? null : rule.min().toPlainString())
                .max(rule.max() == null ? null : rule.max().toPlainString())
                .notBefore(rule.notBefore())
                .notAfter(rule.notAfter())
                .minDaysFromToday(rule.minDaysFromToday())
                .maxDaysFromToday(rule.maxDaysFromToday())
                .otherRequirementId(rule.otherRequirementId())
                .order(
                        rule.order() == null
                                ? null
                                : com.avenra.contract.v1.model.VerificationRule.OrderEnum.fromValue(
                                        rule.order().name()))
                .maxBytes(rule.maxBytes());
        if (!rule.values().isEmpty()) {
            api.values(new ArrayList<>(rule.values()));
        }
        if (!rule.contentTypes().isEmpty()) {
            api.contentTypes(new ArrayList<>(rule.contentTypes()));
        }
        return api;
    }

    private static @Nullable BigDecimal decimal(@Nullable String value) {
        return value == null ? null : new BigDecimal(value);
    }
}
