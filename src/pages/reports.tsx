import {
  useGetMonthlyReport,
  useGenerateMonthlyReport,
  getGetMonthlyReportQueryKey,
} from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Download, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function Reports() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: report,
    isLoading,
    error,
  } = useGetMonthlyReport(
    { month, year },
    {
      query: {
        queryKey: getGetMonthlyReportQueryKey({ month, year }),
        retry: false,
      },
    },
  );

  const generateReport = useGenerateMonthlyReport();

  const handleGenerate = () => {
    generateReport.mutate(
      { data: { month, year } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetMonthlyReportQueryKey({ month, year }),
          });
          toast({ title: "Report generated successfully" });
        },
        onError: (err: any) => {
          toast({
            title: "Failed to generate report",
            description: err.message || "An error occurred",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handlePrint = () => {
    const monthName = format(new Date(2000, month - 1, 1), "MMMM");
    const originalTitle = document.title;
    document.title = `Monthly-Report-${monthName}-${year}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">
            Monthly Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate and view month-end financial settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="w-35 bg-card">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {format(new Date(2000, m - 1, 1), "MMMM")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-25 bg-card">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error || !report ? (
        <Card className="border-dashed bg-muted/30 print:hidden">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No report generated</h3>
            <p className="text-muted-foreground mb-6 mt-1 max-w-md">
              No financial report for {format(new Date(2000, month - 1, 1), "MMMM")} {year}.
            </p>
            <Button onClick={handleGenerate} disabled={generateReport.isPending} className="gap-2">
              <Calculator className="h-4 w-4" />
              {generateReport.isPending ? "Calculating..." : "Generate Report"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end print:hidden">
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <Download className="h-4 w-4" />
              Print / Save PDF
            </Button>
            <Button variant="secondary" className="gap-2 ml-2" onClick={handleGenerate} disabled={generateReport.isPending}>
              <Calculator className="h-4 w-4" />
              Recalculate
            </Button>
          </div>

          <div id="report-content" className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="text-center mb-8 pb-6 border-b border-border/50">
              <h2 className="text-2xl font-serif font-bold text-primary">Hostel Financial Report</h2>
              <p className="text-lg text-muted-foreground mt-1">
                {format(new Date(2000, report.month - 1, 1), "MMMM")} {report.year}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                Generated at: {format(new Date(report.generatedAt), "PPpp")}
              </p>
            </div>

            <div className="flex flex-row gap-4 mb-8">
              <div className="flex-1 bg-muted/30 p-4 rounded-lg border border-border/50 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Meals</p>
                <p className="text-3xl font-mono font-bold">{report.totalMeals}</p>
              </div>
              <div className="flex-1 bg-muted/30 p-4 rounded-lg border border-border/50 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Cost</p>
                <p className="text-3xl font-mono font-bold">${(report.totalBazarCost ?? 0).toFixed(2)}</p>
              </div>
              <div className="flex-1 bg-muted/30 p-4 rounded-lg border border-border/50 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Deposits</p>
                <p className="text-3xl font-mono font-bold">
                  ${report.students.reduce((sum, s) => sum + s.totalDeposits, 0).toFixed(2)}
                </p>
              </div>
              <div className="flex-1 bg-primary/10 p-4 rounded-lg border border-primary/20 text-center">
                <p className="text-sm font-medium text-primary mb-1">Meal Rate</p>
                <p className="text-3xl font-mono font-bold text-primary">${report.mealRate.toFixed(2)}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs uppercase tracking-wider">
                  <TableHead className="font-bold">Student</TableHead>
                  <TableHead className="text-right font-bold">Meals</TableHead>
                  <TableHead className="text-right font-bold">Meal Bill</TableHead>
                  <TableHead className="text-right font-bold">Settlement Status</TableHead>
                  <TableHead className="text-right font-bold">Deposits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.students.map((student) => {
                  const mealSettlement = student.totalDeposits - student.mealBill;
                  return (
                    <TableRow key={student.studentId} className="hover:bg-transparent">
                      <TableCell>
                        <div className="font-medium">{student.studentName}</div>
                        <div className="text-[10px] text-muted-foreground">Room {student.roomNumber}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{student.totalMeals}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">${student.mealBill.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {mealSettlement > 0 ? (
                          <span className="text-primary">Get ${mealSettlement.toFixed(2)}</span>
                        ) : mealSettlement < 0 ? (
                          <span className="text-destructive">Pay ${Math.abs(mealSettlement).toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">Settled</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-primary font-bold">${student.totalDeposits.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/30 border-t-2">
                  <TableCell className="font-bold" colSpan={4}>Overall Totals</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    ${report.students.reduce((sum, s) => sum + s.totalDeposits, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-12 pt-6 border-t border-border/50 flex justify-between items-center text-sm text-muted-foreground">
              <p>Manager Signature: _______________________</p>
              <p>Date: _______________________</p>
            </div>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * { visibility: hidden; }
              #report-content, #report-content * { visibility: visible; }
              #report-content { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; padding: 20px; }
              .print\\:hidden { display: none !important; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `}} />
        </div>
      )}
    </div>
  );
}