"use client";

import { deleteOrder, updateOrderStatus } from "@/server/actions/order";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderActionsProps {
  orderId: string;
  currentStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    
    setIsLoading(true);
    const res = await deleteOrder(orderId);
    setIsLoading(false);

    if (res.success) toast.success("Order deleted");
    else toast.error("Error deleting order");
  };

  const handleStatusChange = async (val: string) => {
    setIsLoading(true);
    // @ts-expect-error Type safety for enum
    const res = await updateOrderStatus(orderId, val);
    setIsLoading(false);

    if (res.success) toast.success("Status updated");
    else toast.error("Error updating status");
  };

  return (
    <div className="flex items-center gap-2">
      <Select defaultValue={currentStatus} onValueChange={handleStatusChange} disabled={isLoading}>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleDelete} disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}