import { model, Schema, Document, SchemaTypes, models } from 'mongoose';
import { IUser } from './user';

export interface INamespace extends Document {
  name: string;
  user: IUser['_id'];
}

async function uniqueName(
  // this: INamespace | Query<any, INamespace>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: any,
  name: string
) {
  try {
    const user = this.user || this.getQuery().user;
    const namespace = await models.Namespace.findOne({ name, user });
    return !namespace;
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return false;
  }
}

const namespaceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Los espacios deben tener un nombre'],
      minlength: [5, 'Los espacios deben tener al menos 5 carácteres'],
      maxlength: [25, 'Los espacios no deben tener más de 25 carácteres'],
      validate: [
        {
          validator: uniqueName,
          message: 'El espacio ya existe',
        },
      ],
    },
    user: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Namespace = model<INamespace>('Namespace', namespaceSchema);
