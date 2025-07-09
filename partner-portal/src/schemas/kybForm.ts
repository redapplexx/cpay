
// /partner-portal/src/schemas/kybForm.ts
import { z } from 'zod';

// Schema for Step 1: Business Information
export const businessInfoSchema = z.object({
  businessProfile: z.object({
    type: z.enum(['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'CORPORATION'], {
      required_error: 'Please select a business type.',
    }),
    registeredName: z.string().min(3, 'Registered business name is required.'),
    tin: z.string().regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/, 'Please enter a valid TIN (e.g., 123-456-789-000).'),
    address: z.string().min(10, 'Registered business address is required.'),
  }),
});

// Schema for Step 2: Document Upload
export const documentUploadSchema = z.object({
  kybDocuments: z.object({
    businessRegistrationFileUrl: z.string({ required_error: 'Please upload your business registration document.'}).url('Invalid URL for business registration.'),
    secretaryCertificateUrl: z.string().url().optional(),
  }),
});

// Schema for Step 3: Settlement Account
export const settlementAccountSchema = z.object({
  settlementAccount: z.object({
    bankName: z.string().min(2, 'Bank name is required.'),
    accountName: z.string().min(2, 'Account holder name is required.'),
    accountNumber: z.string().min(5, 'Account number is required.'),
  }),
});

// Combined schema for the entire form with conditional validation
export const kybFormSchema = businessInfoSchema.merge(documentUploadSchema).merge(settlementAccountSchema)
  .refine(data => {
    if (data.businessProfile.type === 'CORPORATION') {
      return !!data.kybDocuments.secretaryCertificateUrl;
    }
    return true;
  }, {
    message: "Secretary's Certificate is required for corporations.",
    path: ['kybDocuments', 'secretaryCertificateUrl'],
  });

export type KYCFormData = z.infer<typeof kybFormSchema>;
