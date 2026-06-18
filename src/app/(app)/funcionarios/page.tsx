import { PageHeader } from "@/components/ui/page-header";
import { EmployeesManager } from "@/components/funcionarios/employees-manager";
import { getEmployees, getSectors } from "@/lib/data/queries";

export default async function FuncionariosPage() {
  const [employees, sectors] = await Promise.all([getEmployees(), getSectors()]);
  const ativos = employees.filter((e) => e.ativo).length;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Funcionários"
        subtitle={`${employees.length} cadastrados · ${ativos} ativos`}
      />
      <EmployeesManager employees={employees} sectors={sectors} />
    </div>
  );
}
