import { useListStudents, useToggleMealStatus } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { getListStudentsQueryKey } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { Search, Hash, User, UtensilsCrossed, Power, PowerOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MealStatusComponent() {
  const { data: students, isLoading } = useListStudents();
  const toggleStatus = useToggleMealStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    const query = searchQuery.toLowerCase().trim();
    return students.filter((s: any) => 
      s.name?.toLowerCase().includes(query) || 
      s.roomNumber?.toString().includes(query)
    );
  }, [students, searchQuery]);

  const handleToggle = (studentId: number, currentStatus: string) => {
    const isMealOn = currentStatus === "ON";
    toggleStatus.mutate(
      { studentId, isMealOn: !isMealOn },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
          toast({
            title: `Status: ${!isMealOn ? "ON" : "OFF"}`,
            description: "Update synchronized successfully.",
          });
        },
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary tracking-tight">
            Meal Status
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Manage student dining availability in real-time.
          </p>
        </div>

        <div className="relative group w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search name or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* MAIN CONTENT - RESPONSIVE CONTAINER */}
      <Card className="border-muted-foreground/10 shadow-xl shadow-primary/5 overflow-hidden">
        <CardContent className="p-0">
          
          {/* DESKTOP TABLE VIEW (Visible on sm+) */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Student</div>
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    <div className="flex items-center gap-2"><Hash className="h-3.5 w-3.5" /> Room</div>
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Meal Status</TableHead>
                  <TableHead className="text-right pr-6 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletons />
                ) : filteredStudents.length === 0 ? (
                  <EmptyState />
                ) : (
                  filteredStudents.map((student: any) => (
                    <TableRow key={student.id} className="group hover:bg-primary/[0.02] transition-colors border-b last:border-0">
                      <TableCell className="py-4 pl-6 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-foreground/90">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded bg-secondary/50 text-secondary-foreground font-mono text-xs border border-secondary">
                          {student.roomNumber || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            student.meal_status === "ON" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-400"
                          )} />
                          <span className={cn(
                            "text-xs font-bold uppercase",
                            student.meal_status === "ON" ? "text-emerald-600" : "text-red-500"
                          )}>
                            {student.meal_status === "ON" ? "ON" : "OFF"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <StatusButton 
                          status={student.meal_status} 
                          loading={toggleStatus.isPending} 
                          onClick={() => handleToggle(student.id, student.meal_status)} 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* MOBILE LIST VIEW (Visible on < 640px) */}
          <div className="block sm:hidden divide-y divide-muted/50">
            {isLoading ? (
              <MobileSkeletons />
            ) : filteredStudents.length === 0 ? (
              <EmptyState />
            ) : (
              filteredStudents.map((student: any) => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground leading-tight">{student.name}</p>
                      <p className="text-xs text-muted-foreground">Room: {student.roomNumber || "—"}</p>
                      <p className="text-xs text-muted-foreground">Status: {student.meal_status === "ON" ? "ON" : "OFF"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusButton 
                      status={student.meal_status} 
                      loading={toggleStatus.isPending} 
                      onClick={() => handleToggle(student.id, student.meal_status)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

function StatusButton({ status, loading, onClick }: { status: string, loading: boolean, onClick: () => void }) {
  const isOn = status === "ON";
  return (
    <Button
      size="sm"
      variant={isOn ? "outline" : "default"}
      onClick={onClick}
      disabled={loading}
      className={cn(
        "h-9 w-28 font-semibold transition-all duration-300",
        isOn 
          ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" 
          : "bg-primary shadow-md hover:shadow-lg active:scale-95"
      )}
    >
      {isOn ? <PowerOff className="mr-2 h-3.5 w-3.5" /> : <Power className="mr-2 h-3.5 w-3.5" />}
      {isOn ? "Turn OFF" : "Turn ON"}
    </Button>
  );
}

function TableSkeletons() {
  return Array(5).fill(0).map((_, i) => (
    <TableRow key={i}>
      <TableCell className="pl-6"><Skeleton className="h-6 w-32" /></TableCell>
      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      <TableCell className="pr-6"><Skeleton className="h-9 w-28 ml-auto" /></TableCell>
    </TableRow>
  ));
}

function MobileSkeletons() {
  return Array(4).fill(0).map((_, i) => (
    <div key={i} className="p-4 flex justify-between items-center">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-12" /></div>
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
  ));
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">No students found</h3>
      <p className="text-sm text-muted-foreground/60">Try adjusting your search criteria.</p>
    </div>
  );
}