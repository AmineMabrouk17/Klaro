import { getServerApi } from '@/lib/api.server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_ENDPOINTS } from '@klaro/shared';

interface Transaction {
  id: string;
  transaction_date: string;
  amount: string;
  transaction_type: 'credit' | 'debit';
  category: string | null;
  description: string | null;
  counterparty: string | null;
  currency: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  salary: 'Salary',
  freelance_income: 'Freelance',
  transfer_in: 'Transfer in',
  transfer_out: 'Transfer out',
  food: 'Food',
  food_delivery: 'Delivery',
  groceries: 'Groceries',
  transport: 'Transport',
  fuel: 'Fuel',
  utilities: 'Utilities',
  rent: 'Rent',
  telecom: 'Telecom',
  subscription: 'Subscription',
  health: 'Health',
  education: 'Education',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  cash_withdrawal: 'Cash',
  fees: 'Fees',
  loan_payment: 'Loan',
  insurance: 'Insurance',
  savings: 'Savings',
  other: 'Other',
};

export default async function TransactionsPage() {
  const api = await getServerApi();

  let transactions: Transaction[] = [];
  try {
    transactions = await api.get<Transaction[]>(API_ENDPOINTS.transactions.list);
  } catch {
    transactions = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">Categorized automatically with Claude Haiku.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {transactions.length > 0
              ? `${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`
              : 'No transactions yet'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Connect a bank or upload a statement to see your transactions here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-2.5 tabular-nums text-muted-foreground">
                        {tx.transaction_date}
                      </td>
                      <td className="py-2.5">
                        {tx.counterparty ?? tx.description ?? '—'}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {CATEGORY_LABELS[tx.category ?? ''] ?? tx.category ?? '—'}
                      </td>
                      <td
                        className={`py-2.5 text-right tabular-nums font-medium ${
                          tx.transaction_type === 'credit' ? 'text-green-600' : 'text-foreground'
                        }`}
                      >
                        {tx.transaction_type === 'credit' ? '+' : '-'}
                        {Number(tx.amount).toFixed(2)} {tx.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
