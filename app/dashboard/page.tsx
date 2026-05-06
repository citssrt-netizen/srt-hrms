import { AppShell } from "@/components/layout/AppShell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Employees</CardDescription>
            <CardTitle>124</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Active Staff</CardDescription>
            <CardTitle>118</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Pending Leave</CardDescription>
            <CardTitle>9</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Payroll Status</CardDescription>
            <CardTitle>Processing</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </AppShell>
  );
}