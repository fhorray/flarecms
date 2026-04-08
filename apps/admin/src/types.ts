export interface Collection {
  id: string;
  slug: string;
  label: string;
  labelSingular: string;
  createdAt: Date | string;
}

export interface Field {
  id: string;
  collectionId: string;
  label: string;
  slug: string;
  type: 'text' | 'richtext' | 'number' | 'boolean' | 'date';
  required: boolean;
  createdAt: Date | string;
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
