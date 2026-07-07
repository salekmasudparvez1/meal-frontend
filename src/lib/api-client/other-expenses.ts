import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface OtherExpenseUser {
  id: number;
  username: string;
  roomNumber: number;
}

export interface OtherExpensePayment {
  id: number;
  otherExpenseId: number;
  userId: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  user: OtherExpenseUser;
}

export interface OtherExpense {
  id: number;
  type: string;
  amount: number;
  date: string;
  createdAt: string;
  payments: OtherExpensePayment[];
}

export interface CreateOtherExpenseInput {
  type: string;
  amount: number;
  date: string;
  studentIds?: number[];
}

export interface UpdatePaymentsInput {
  studentIds: number[];
}

// URLs
export const getListOtherExpensesUrl = () => `/api/other-expenses`;
export const getCreateOtherExpenseUrl = () => `/api/other-expenses`;
export const getDeleteOtherExpenseUrl = (id: number) => `/api/other-expenses/${id}`;
export const getUpdateOtherExpensePaymentsUrl = (id: number) => `/api/other-expenses/${id}/payments`;

// Query keys
export const getListOtherExpensesQueryKey = () => ["other-expenses"] as const;

// Fetchers
export const listOtherExpenses = async (options?: RequestInit): Promise<OtherExpense[]> => {
  return customFetch<OtherExpense[]>(getListOtherExpensesUrl(), {
    ...options,
    method: "GET",
  });
};

export const createOtherExpense = async (data: CreateOtherExpenseInput, options?: RequestInit): Promise<OtherExpense> => {
  return customFetch<OtherExpense>(getCreateOtherExpenseUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(data),
  });
};

export const updateOtherExpensePayments = async (id: number, data: UpdatePaymentsInput, options?: RequestInit): Promise<OtherExpense> => {
  return customFetch<OtherExpense>(getUpdateOtherExpensePaymentsUrl(id), {
    ...options,
    method: "PUT",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(data),
  });
};

export const deleteOtherExpense = async (id: number, options?: RequestInit): Promise<void> => {
  return customFetch<void>(getDeleteOtherExpenseUrl(id), {
    ...options,
    method: "DELETE",
  });
};

// React Query Hooks
export function useListOtherExpenses(options?: { query?: any }): UseQueryResult<OtherExpense[], Error> & { queryKey: any } {
  const queryKey = getListOtherExpensesQueryKey();
  const query = useQuery({
    queryKey,
    queryFn: () => listOtherExpenses(),
    ...options?.query,
  }) as UseQueryResult<OtherExpense[], Error> & { queryKey: any };
  return { ...query, queryKey };
}

export function useCreateOtherExpense(): UseMutationResult<OtherExpense, Error, { data: CreateOtherExpenseInput }> {
  return useMutation({
    mutationFn: (props) => createOtherExpense(props.data),
  });
}

export function useUpdateOtherExpensePayments(id: number): UseMutationResult<OtherExpense, Error, { data: UpdatePaymentsInput }> {
  return useMutation({
    mutationFn: (props) => updateOtherExpensePayments(id, props.data),
  });
}

export function useDeleteOtherExpense(): UseMutationResult<void, Error, { id: number }> {
  return useMutation({
    mutationFn: (props) => deleteOtherExpense(props.id),
  });
}
