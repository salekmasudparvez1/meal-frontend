import { useListStudents } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Search } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";

export default function Students() {
  const { data: students, isLoading } = useListStudents();
  const [search, setSearch] = useState("");

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    const lower = search.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.roomNumber.toLowerCase().includes(lower) ||
        s.email.toLowerCase().includes(lower),
    );
  }, [students, search]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">
            Students
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage hostel residents and their balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Resident</TableHead>
                <TableHead>Room</TableHead>
                <TableHead className="text-right">Meals</TableHead>
                <TableHead className="text-right">Deposits</TableHead>
                <TableHead className="text-right">Meal Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-12.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-5 w-12 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-5 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-5 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-5 w-20 ml-auto" />
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {search
                      ? "No students found matching your search."
                      : "No students registered yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className={
                      student?.meal_status === "ON"
                        ? "group hover:bg-muted/30 transition-colors cursor-pointer"
                        : "group hover:bg-red-100 bg-red-200 transition-colors cursor-pointer"
                    }
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/students/${student.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="hover:underline">{student.name}</div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {student.email}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-secondary-border">
                        {student.roomNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {student.totalMeals}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(student.totalDeposits ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors
    ${
      student.meal_status === "ON"
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
        : "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-400"
    }`}
                      >
                        {/* Optional Dot Icon */}
                        <span
                          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${student.meal_status === "ON" ? "bg-emerald-500" : "bg-zinc-400"}`}
                        />
                        {student.meal_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      <span
                        className={
                          (student.currentBalance ?? 0) >= 0
                            ? "text-primary"
                            : "text-destructive"
                        }
                      >
                        ${(student.currentBalance ?? 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/students/${student.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
