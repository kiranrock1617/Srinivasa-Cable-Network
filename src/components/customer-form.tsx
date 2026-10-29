import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { customerInputSchema, type CustomerInput } from "@/lib/customers.schema";
import { VcScanner } from "@/components/vc-scanner";

const MAX_IMAGE_BYTES = 700 * 1024; // ~700KB

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export type CustomerFormProps = {
  initial?: Partial<CustomerInput>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: CustomerInput) => void | Promise<void>;
  onCancel?: () => void;
};

export function CustomerForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [image, setImage] = useState(initial?.image ?? "");
  // Gate the submit button until React has hydrated on the client, so a click
  // never triggers a bare native form GET before handlers are attached.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const form = useForm({
    resolver: zodResolver(customerInputSchema) as any,
    mode: "onTouched",
    defaultValues: {
      serialNo: initial?.serialNo ?? ("" as unknown as number),
      name: initial?.name ?? "",
      vcNo: initial?.vcNo ?? "",
      address: initial?.address ?? "",
      phone: initial?.phone ?? "",
      image: initial?.image ?? "",
    },
  });


  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.warning("Image is larger than 700KB — please compress it before uploading.");
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setImage(base64);
      form.setValue("image", base64, { shouldDirty: true });
    } catch (err) {
      console.error("[image-upload]", err);
      toast.error("Could not read the image file");
    }
  }

  function clearImage() {
    setImage("");
    form.setValue("image", "", { shouldDirty: true });
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit({ ...(values as CustomerInput), image });
    } catch (err) {
      // Parent mutation surfaces its own toast; log here for diagnostics.
      console.error("[customer-form:submit]", err);
    }
  });


  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(e);
      }}
      noValidate
      className="space-y-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="serialNo">Serial No</Label>
          <Input
            id="serialNo"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="Enter serial number"
            aria-invalid={!!form.formState.errors.serialNo}
            {...form.register("serialNo")}
          />
          {form.formState.errors.serialNo && (
            <p className="text-xs text-destructive">
              {String((form.formState.errors.serialNo as any)?.message ?? "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Customer full name"
            aria-invalid={!!form.formState.errors.name}
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="vcNo">VC No</Label>
          <div className="flex items-center gap-2">
            <Input
              id="vcNo"
              placeholder="11-character VC No"
              maxLength={11}
              aria-invalid={!!form.formState.errors.vcNo}
              {...form.register("vcNo")}
            />
            <VcScanner
              disabled={submitting}
              onResult={(value) =>
                form.setValue("vcNo", value, { shouldDirty: true, shouldValidate: true })
              }
            />
          </div>

          {form.formState.errors.vcNo && (
            <p className="text-xs text-destructive">{form.formState.errors.vcNo.message}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="Street, area, city"
            rows={3}
            aria-invalid={!!form.formState.errors.address}
            {...form.register("address")}
          />
          {form.formState.errors.address && (
            <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="10-digit phone number"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={!!form.formState.errors.phone}
            {...form.register("phone")}
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Photo (optional)</Label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="image"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Upload className="h-4 w-4" />
              {image ? "Replace" : "Upload"}
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {image && (
              <div className="relative">
                <img
                  src={image}
                  alt="preview"
                  className="h-12 w-12 rounded-full object-cover ring-1 ring-border"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Stored inline as base64 in MongoDB. Keep images under ~700KB.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={submitting || !ready}
          onClick={(e) => {
            // Extra safety: if this button ever bubbles a click without the
            // form's synthetic onSubmit firing (e.g. during hydration edge
            // cases), still trigger react-hook-form's submit path.
            if (submitting || !ready) return;
            e.preventDefault();
            void submit();
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submitting ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
