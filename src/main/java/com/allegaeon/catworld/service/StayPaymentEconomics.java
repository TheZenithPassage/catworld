package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.PaymentCondition;
import com.allegaeon.catworld.model.StayPayment;
import com.allegaeon.catworld.validation.WholeMonetaryAmount;

import java.math.BigDecimal;
import java.util.List;

public record StayPaymentEconomics(
        BigDecimal totalPaid,
        BigDecimal remainingAmount,
        PaymentCondition paymentCondition,
        boolean outstandingCollectionEligible) {

    public static StayPaymentEconomics calculate(
            BigDecimal agreedAmount,
            List<StayPayment> payments,
            boolean cancelled) {

        List<StayPayment> activePayments = payments.stream()
                .filter(payment -> !payment.isAnnulled())
                .toList();
        BigDecimal totalPaid = activePayments.stream()
                .map(StayPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        totalPaid = WholeMonetaryAmount.canonicalize(totalPaid);

        if (agreedAmount == null) {
            if (!activePayments.isEmpty()) {
                throw new IllegalStateException(
                        "A stay without an agreed amount cannot have active payments"
                );
            }
            return new StayPaymentEconomics(
                    BigDecimal.ZERO,
                    null,
                    PaymentCondition.NO_PAYMENT,
                    false
            );
        }

        BigDecimal canonicalAgreement =
                WholeMonetaryAmount.canonicalize(agreedAmount);
        BigDecimal historicalRemainingAmount = canonicalAgreement.subtract(totalPaid);
        if (historicalRemainingAmount.signum() < 0) {
            throw new IllegalStateException(
                    "Active payments cannot exceed the agreed amount"
            );
        }

        PaymentCondition condition;
        if (activePayments.isEmpty()) {
            condition = PaymentCondition.NO_PAYMENT;
        } else if (historicalRemainingAmount.signum() == 0) {
            condition = PaymentCondition.FULL_PAYMENT;
        } else {
            condition = PaymentCondition.PARTIAL_PAYMENT;
        }

        return new StayPaymentEconomics(
                totalPaid,
                cancelled ? BigDecimal.ZERO : historicalRemainingAmount,
                condition,
                !cancelled && historicalRemainingAmount.signum() > 0
        );
    }
}
