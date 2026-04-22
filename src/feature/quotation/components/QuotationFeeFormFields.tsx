import {
  FIXED_FEE_OPTIONS,
  formatFeePriceInput,
  getFixedFeeOption,
  normalizeFeePriceInput,
  type FeeDescriptionType,
  type FeeFormState,
} from "@/feature/quotation/utils/quotationFeeOptions";

type QuotationFeeFormFieldsProps = {
  form: FeeFormState;
  onChange: (nextForm: FeeFormState) => void;
};

export default function QuotationFeeFormFields({
  form,
  onChange,
}: QuotationFeeFormFieldsProps) {
  const handleDescriptionTypeChange = (value: FeeDescriptionType) => {
    const fixedOption = getFixedFeeOption(value);
    onChange({
      ...form,
      descriptionType: value,
      isSubtracted: fixedOption?.isSubtracted ?? form.isSubtracted,
      description: fixedOption?.description ?? "",
    });
  };

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
      <select
        value={form.descriptionType}
        onChange={(event) =>
          handleDescriptionTypeChange(event.target.value as FeeDescriptionType)
        }
        className="rounded-md border border-gray-200 px-2 py-1 text-xs"
      >
        {FIXED_FEE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value="OTHER">Phí khác</option>
      </select>

      <input
        type="text"
        inputMode="numeric"
        value={formatFeePriceInput(form.price)}
        onChange={(event) =>
          onChange({ ...form, price: normalizeFeePriceInput(event.target.value) })
        }
        className="rounded-md border border-gray-200 px-2 py-1 text-xs"
        placeholder="Giá phí"
      />

      {form.descriptionType === "OTHER" && (
        <>
          <select
            value={form.isSubtracted}
            onChange={(event) =>
              onChange({ ...form, isSubtracted: Number(event.target.value) })
            }
            className="rounded-md border border-gray-200 px-2 py-1 text-xs"
          >
            <option value={1}>Phí cộng thêm</option>
            <option value={0}>Phí giảm trừ</option>
          </select>

          <input
            value={form.description}
            onChange={(event) =>
              onChange({ ...form, description: event.target.value })
            }
            className="rounded-md border border-gray-200 px-2 py-1 text-xs"
            placeholder="Mô tả phí khác *"
          />
        </>
      )}
    </div>
  );
}
