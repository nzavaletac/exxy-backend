import { model, Schema, Document, SchemaTypes } from 'mongoose';
import endOfToday from 'date-fns/endOfToday';
import { ICategory } from './categories';

export interface IExpense extends Document {
  merchant: string;
  date: Date;
  currency: string;
  amount: number;
  category: ICategory['_id'];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

async function noFutureExpense(date: Date): Promise<boolean> {
  try {
    const isInFuture = endOfToday() < date;
    if (isInFuture) return false;
    return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return false;
  }
}

const expenseSchema = new Schema(
  {
    merchant: {
      type: String,
      minlength: [5, 'El comerciante debe tener al menos 5 carácteres'],
      maxlength: [50, 'El comerciante no debe tener más de 50 carácteres'],
      required: [true, 'Los gastos deben tener un comerciante'],
    },
    date: {
      type: Date,
      validate: [
        {
          validator: noFutureExpense,
          message: 'Los gastos no deben ser futuros',
        },
      ],
      default: () => {
        const date = new Date();
        date.setUTCHours(12);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        return date;
      },
    },
    currency: {
      type: String,
      enum: {
        values: ['COP', 'USD'],
        message: 'La moneda debe ser COP ó USD',
      },
      default: 'COP',
    },
    amount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      maxlength: [255, 'La descripción no debe tener más de 255 carácteres'],
      default: '',
    },
    category: {
      type: SchemaTypes.ObjectId,
      ref: 'Category',
    },
  },
  { timestamps: true }
);

export const Expense = model<IExpense>('Expense', expenseSchema);
