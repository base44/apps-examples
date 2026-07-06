// App data types. These mirror the JSONC entity schemas in base44/entities and
// give the loaders/components typed records. `EntityFields` are the server-managed
// fields Base44 adds to every record.

export interface EntityFields {
  id: string;
  created_date: string;
  updated_date: string;
  created_by?: string | null;
}

export type PropertyType = "house" | "apartment" | "condo" | "land";
export type PropertyStatus = "for_sale" | "sold" | "pending";

export interface PropertyImage {
  url: string;
}

export interface PropertyInput {
  title: string;
  description?: string;
  price: number;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  property_type: PropertyType;
  status: PropertyStatus;
  images?: PropertyImage[];
  featured?: boolean;
  agent_email: string;
}

export type Property = PropertyInput & EntityFields;

export type InquiryStatus = "new" | "contacted" | "closed";

export interface InquiryInput {
  property_id: string;
  property_title?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status?: InquiryStatus;
  agent_email: string;
}

export type Inquiry = InquiryInput & EntityFields & { status: InquiryStatus };

export interface FavoriteInput {
  property_id: string;
  user_email: string;
}

export type Favorite = FavoriteInput & EntityFields;

export interface SessionUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}
