import { useGetStudent, getGetStudentQueryKey } from "@/lib/api-client";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowLeft, Utensils, Wallet, ShoppingBag, Clock } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function StudentProfile() {
  const { studentId } = useParams();
  const id = parseInt(studentId || "0", 10);
  const { isUser } = useAuth();
  
  const { data: student, isLoading, error } = useGetStudent(id, { 
    query: { enabled: !!id, queryKey: getGetStudentQueryKey(id) } 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !student) {
    return <div className="text-destructive">Failed to load student profile.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        {!isUser && (
          <Link href="/students" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Link>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-primary/20">
              {student.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">{student.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                  Room {student.roomNumber}
                </span>
                <span>•</span>
                <span className="text-sm">{student.email}</span>
              </div>
            </div>
          </div>
          
          <Card className="w-full sm:w-auto bg-card shadow-sm border-primary/10">
            <CardContent className="p-4 flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <div className={`text-2xl font-bold font-mono ${student.currentBalance >= 0 ? "text-primary" : "text-destructive"}`}>
                  ${student.currentBalance.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Meals</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{student.totalMeals}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposits</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">${student.totalDeposits.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bazar Share</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">${student.totalBazarCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="meals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="meals">Meals History</TabsTrigger>
          <TabsTrigger value="deposits">Deposit History</TabsTrigger>
        </TabsList>
        <TabsContent value="meals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Meal Entries</CardTitle>
              <CardDescription>Record of meals consumed by {student.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              {student.meals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Utensils className="h-8 w-8 mb-2 opacity-20" />
                  <p>No meals logged yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time Logged</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.meals.map((meal) => (
                      <TableRow key={meal.id}>
                        <TableCell className="font-medium">{format(new Date(meal.date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {format(new Date(meal.createdAt), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium bg-muted/20">{meal.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="deposits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposits</CardTitle>
              <CardDescription>Funds added by {student.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              {student.deposits.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Wallet className="h-8 w-8 mb-2 opacity-20" />
                  <p>No deposits made yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.deposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-medium">{format(new Date(deposit.date), "MMM d, yyyy")}</TableCell>
                        <TableCell className="font-mono text-primary font-bold">+${deposit.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{deposit.note || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
