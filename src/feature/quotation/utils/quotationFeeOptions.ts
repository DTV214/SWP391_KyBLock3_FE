import type { QuotationFee, QuotationMessage } from "@/feature/quotation/services/quotationService";

export type FeeDescriptionType =
  | "PRODUCT_UNIT_DISCOUNT"
  | "SHIPPING"
  | "PACKAGING"
  | "OTHER";

export type FeeFormState = {
  isSubtracted: number;
  price: string;
  descriptionType: FeeDescriptionType;
  description: string;
};

export type FixedFeeOption = {
  value: Exclude<FeeDescriptionType, "OTHER">;
  label: string;
  description: string;
  isSubtracted: number;
};

export const FIXED_FEE_OPTIONS: FixedFeeOption[] = [
  {
    value: "PRODUCT_UNIT_DISCOUNT",
    label: "Phí giảm sản phẩm",
    description: "Phí giảm giá sản phẩm",
    isSubtracted: 0,
  },
  {
    value: "SHIPPING",
    label: "Phí vận chuyển",
    description: "Phí vận chuyển",
    isSubtracted: 1,
  },
  {
    value: "PACKAGING",
    label: "Phí đóng gói",
    description: "Phí đóng gói",
    isSubtracted: 1,
  },
];

export const DEFAULT_FEE_FORM: FeeFormState = {
  isSubtracted: 0,
  price: "",
  descriptionType: "PRODUCT_UNIT_DISCOUNT",
  description: "Phí giảm giá Đơn giá sản phẩm",
};

export const normalizeFeePriceInput = (value: string) =>
  value.replace(/\D/g, "");

export const formatFeePriceInput = (value: string) => {
  const rawValue = normalizeFeePriceInput(value);
  if (!rawValue) return "";

  return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const getFixedFeeOption = (value: FeeDescriptionType) =>
  FIXED_FEE_OPTIONS.find((option) => option.value === value);

const normalizeDescription = (value?: string | null) =>
  (value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");

export const findExistingFixedFee = (
  fees: QuotationFee[],
  descriptionType: FeeDescriptionType,
) => {
  const fixedFeeOption = getFixedFeeOption(descriptionType);
  if (!fixedFeeOption) return undefined;

  return fees.find(
    (fee) =>
      normalizeDescription(fee.description) ===
      normalizeDescription(fixedFeeOption.description),
  );
};

export const getFeeFormForExistingFee = (fee: QuotationFee): FeeFormState => {
  const fixedOption = FIXED_FEE_OPTIONS.find(
    (option) =>
      normalizeDescription(option.description) === normalizeDescription(fee.description),
  );

  if (fixedOption) {
    return {
      isSubtracted: fixedOption.isSubtracted,
      price: String(fee.price),
      descriptionType: fixedOption.value,
      description: fixedOption.description,
    };
  }

  return {
    isSubtracted: fee.isSubtracted,
    price: String(fee.price),
    descriptionType: "OTHER",
    description: fee.description || "",
  };
};

export const resolveFeeFormPayload = (form: FeeFormState) => {
  const fixedOption = getFixedFeeOption(form.descriptionType);
  if (fixedOption) {
    return {
      isSubtracted: fixedOption.isSubtracted,
      description: fixedOption.description,
    };
  }

  const description = form.description.trim();
  if (!description) return null;

  return {
    isSubtracted: form.isSubtracted,
    description,
  };
};

export const isHiddenQuotationMessage = (message: QuotationMessage) =>
  message.actionType === "NOTE";
