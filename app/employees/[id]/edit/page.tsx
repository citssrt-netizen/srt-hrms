import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getEmployee(id: string) {
  const { data, error } = await supabaseAdmin
    .from("hr_employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function EditEmployeePage({ params }: PageProps) {
  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  return (
    <AppShell title="Edit Employee">
      <Card>
        <CardHeader>
          <CardTitle>Edit Employee</CardTitle>
          <CardDescription>
            Update employee profile and HR information.
          </CardDescription>
        </CardHeader>

        <pre className="rounded-xl bg-slate-950 p-4 text-sm text-white">
          {JSON.stringify(employee, null, 2)}
        </pre>
      </Card>
    </AppShell>
  );
}