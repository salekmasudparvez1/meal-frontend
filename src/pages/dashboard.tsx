import {
  useGetDashboard,
  useGetStudent,
  getGetDashboardQueryKey,
  getGetStudentQueryKey,
} from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Utensils,
  Wallet,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useMemo, useState } from "react";

export default function Dashboard() {
  const { isUser, user } = useAuth();
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const {
    data: dashboard,
    isLoading,
    error,
  } = useGetDashboard({
    query: {
      queryKey: getGetDashboardQueryKey(),
      enabled: !isUser,
    },
  });

  // If USER, we fetch their specific student profile
  const { data: studentProfile, isLoading: isStudentLoading } = useGetStudent(
    user?.studentId || 0,
    {
      query: {
        enabled: isUser && !!user?.studentId,
        queryKey: getGetStudentQueryKey(user?.studentId || 0),
      },
    },
  );

  const calendarMonthDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + calendarMonthOffset, 1);
  }, [calendarMonthOffset]);

  const currentMonthMealDays = useMemo(() => {
    if (!studentProfile) return [];

    const month = calendarMonthDate.getMonth();
    const year = calendarMonthDate.getFullYear();

    return studentProfile.meals
      .filter((meal) => {
        const mealDate = new Date(meal.date);
        return mealDate.getMonth() === month && mealDate.getFullYear() === year;
      })
      .map((meal) => ({
        id: meal.id,
        date: meal.date,
        value: meal.value,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [studentProfile, calendarMonthDate]);

  const mealValueByDay = useMemo(() => {
    const map = new Map<number, number>();
    for (const meal of currentMonthMealDays) {
      const day = new Date(meal.date).getDate();
      map.set(day, (map.get(day) ?? 0) + meal.value);
    }
    return map;
  }, [currentMonthMealDays]);

  const currentMonthCalendarCells = useMemo(() => {
    const year = calendarMonthDate.getFullYear();
    const month = calendarMonthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekDay = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ day: number | null; value: number | null }> = [];

    for (let i = 0; i < startWeekDay; i++) {
      cells.push({ day: null, value: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, value: mealValueByDay.get(day) ?? null });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ day: null, value: null });
    }

    return cells;
  }, [mealValueByDay, calendarMonthDate]);

  if (isLoading || (isUser && isStudentLoading)) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold text-primary">
          Dashboard
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isUser && (error || !dashboard)) {
    return (
      <div className="text-destructive">Failed to load dashboard data.</div>
    );
  }

  if (isUser && !studentProfile) {
    return (
      <div className="text-destructive">
        Failed to load your dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">
            {isUser ? "My Dashboard" : "Overview"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isUser
              ? "Your meal and financial summary."
              : "Hostel system at a glance."}
          </p>
        </div>
        {!isUser && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-3 py-1.5 rounded-full border shadow-sm">
            <Activity className="h-4 w-4" />
            <span>Live Cockpit Status</span>
          </div>
        )}
      </div>

      {isUser && studentProfile ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Meal Status
                </CardTitle>
                <ShoppingBagIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>

              <CardContent>
                <div
                  className={`text-3xl font-bold font-mono ${
                    studentProfile.meal_status === "ON"
                      ? "text-emerald-500"
                      : "text-destructive"
                  }`}
                >
                  {studentProfile.meal_status}
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  {studentProfile.totalMeals*100 +100 >= studentProfile.totalDeposits
                    ? "You blanc has ennded, please add funds or contact admin"
                    : "You have enough balance for your meals"}
                </p>
              </CardContent>
            </Card>
            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  My Meals
                </CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {studentProfile.totalMeals}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total logged meals
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Deposits
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-primary">
                  ${studentProfile.totalDeposits.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Funds added
                </p>
              </CardContent>
            </Card>

           

            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Balance
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-3xl font-bold font-mono",
                    studentProfile.currentBalance >= 0
                      ? "text-primary"
                      : "text-destructive",
                  )}
                >
                  ${studentProfile.currentBalance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated balance
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Current Month Meal Status</CardTitle>
                  <CardDescription>
                    Your per-day meal entries for{" "}
                    {format(calendarMonthDate, "MMMM yyyy")}.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground mb-2">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {currentMonthCalendarCells.map((cell, index) => (
                    <div
                      key={`${cell.day ?? "empty"}-${index}`}
                      className={cn(
                        "min-h-18 rounded-md border p-2 text-sm",
                        cell.day ? "bg-card" : "bg-muted/30 border-dashed",
                      )}
                    >
                      {cell.day ? (
                        <>
                          <div className="text-xs text-muted-foreground">
                            {cell.day}
                          </div>
                          <div className="mt-2 text-center">
                            {cell.value != null ? (
                              <span className="inline-block rounded bg-primary/10 px-2 py-1 font-mono text-primary">
                                {cell.value}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deposit History</CardTitle>
                <CardDescription>Your latest deposit records.</CardDescription>
              </CardHeader>
              <CardContent>
                {studentProfile.deposits.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No deposits found.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {studentProfile.deposits.slice(0, 10).map((deposit) => (
                      <div
                        key={deposit.id}
                        className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">
                            {format(new Date(deposit.date), "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {deposit.note || "No note"}
                          </p>
                        </div>
                        <span className="font-mono font-semibold text-primary">
                          +${deposit.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {dashboard?.totalStudents}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active residents
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Meals Today
                </CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  {dashboard?.totalMealsToday}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Logged for today
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly Expense
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">
                  ${dashboard?.monthlyExpense.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total bazar costs
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Balance
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-3xl font-bold font-mono",
                    (dashboard?.netBalance ?? 0) >= 0
                      ? "text-primary"
                      : "text-destructive",
                  )}
                >
                  ${Math.abs(dashboard?.netBalance ?? 0).toFixed(2)}
                  {(dashboard?.netBalance ?? 0) < 0 && (
                    <span className="text-sm ml-1">deficit</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Overall hostel balance
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4 flex flex-col hover-elevate">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Meals</CardTitle>
                    <CardDescription>
                      Latest meal entries across the hostel.
                    </CardDescription>
                  </div>
                  <Link href="/meals">
                    <span className="text-sm text-primary hover:underline cursor-pointer">
                      View all
                    </span>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {dashboard?.recentMeals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Utensils className="h-8 w-8 mb-2 opacity-20" />
                    <p>No meals logged recently</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard?.recentMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {meal.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{meal.studentName}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(
                                new Date(meal.createdAt),
                                "MMM d, h:mm a",
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono bg-muted px-2 py-1 rounded text-sm font-medium">
                          {meal.value} meals
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 flex flex-col hover-elevate">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Deposits</CardTitle>
                    <CardDescription>
                      Latest funds added by students.
                    </CardDescription>
                  </div>
                  <Link href="/deposits">
                    <span className="text-sm text-primary hover:underline cursor-pointer">
                      View all
                    </span>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {dashboard?.recentDeposits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Wallet className="h-8 w-8 mb-2 opacity-20" />
                    <p>No deposits made recently</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard?.recentDeposits.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center text-secondary-foreground font-bold">
                            {deposit.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{deposit.studentName}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(
                                new Date(deposit.createdAt),
                                "MMM d, h:mm a",
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono text-primary font-bold">
                          +${deposit.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Just a simple wrapper to make it identical to the original missing icon
function ShoppingBagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" x2="21" y1="6" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
