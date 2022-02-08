import { Document, Schema, model, models } from 'mongoose';
import { INamespace } from './namespace';

export interface ICategory extends Document {
  name: string;
  namespace: INamespace['_id'];
}

async function uniqueName(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: any,
  name: string
) {
  try {
    const namespace = this.namespace || this.getQuery().namespace;
    const category = await models.Category.findOne({ name, namespace });
    return !category;
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return false;
  }
}

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Las categorías deben tener un nombre'],
      minlength: [5, 'Las categorías deben tener al menos 5 carácteres'],
      maxlength: [25, 'Las categorías no deben tener más de 25 carácteres'],
      validate: [
        {
          validator: uniqueName,
          message: 'La categoría ya existe en este espacio',
        },
      ],
    },
    namespace: {
      type: Schema.Types.ObjectId,
      ref: 'Namespace',
    },
  },
  {
    timestamps: true,
  }
);

export const Category = model<ICategory>('Category', categorySchema);
