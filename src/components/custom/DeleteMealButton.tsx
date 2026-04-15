import { useToast } from "@/hooks/use-toast";
import { getListMealsQueryKey, useDeleteMeal } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";

function DeleteMealButton({ mealId }: { mealId: number }) {
  const queryClient = useQueryClient();
  const deleteMeal = useDeleteMeal();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);

  const onDelete = () => {
    deleteMeal.mutate(
      { mealId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMealsQueryKey() });
          toast({ title: "Meal deleted" });
          setOpen(false);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete meal",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      {/* Dialog */}
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Meal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this meal entry? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={deleteMeal.isPending}
          >
            {deleteMeal.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default DeleteMealButton;