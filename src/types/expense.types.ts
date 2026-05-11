export interface Expense {
  id: string;
  date: string;
  remark: string | null;
  amount: number;
  receiptPic: string | null;
  serviceRequestId: string | null;
  dynamicData: Record<string, any> | null;
  truckId: string;
  driverId: string | null;
  approved: "PENDING" | "APPROVED";
  tag: string | null;
  createdAt: string;
  updatedAt: string;
  serviceRequest: {
    id: string;
    description: string | null;
    status: string;
    cost: number;
    dynamicData: Record<string, any> | null;
    serviceType: {
      name: string;
    };
  } | null;
  truck: {
    plateNumber: string;
  };
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  truckIds?: string[];
  serviceRequestId?: string;
  amountFrom?: number;
  amountTo?: number;
  approved?: "PENDING" | "APPROVED";
}

export interface AddExpensePayload {
  truckId: string;
  remark: string;
  price: number;
  date: string;
  serviceTypeId?: string;
  serviceRequestId?: string;
  dynamicData?: Record<string, any>;
  receiptPic?: string;
  tag?: "PERDIME" | "SALARY";
}
