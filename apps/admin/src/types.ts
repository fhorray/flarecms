export interface Collection {
  id: string;
  slug: string;
  label: string;
  label_singular: string | null;
  description: string | null;
  icon: string | null;
  is_public: number;
  features: string[];
  url_pattern: string | null;
  createdAt: string;
}

export interface Field {
  id: string;
  collectionId: string;
  label: string;
  slug: string;
  type: 'text' | 'richtext' | 'number' | 'boolean' | 'date';
  required: boolean;
  createdAt: string;
}

export interface CollectionSchema extends Collection {
  fields: Field[];
}

export interface ContentEntry {
  id: string;
  slug: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any; // Content entries are dynamic by nature
}
