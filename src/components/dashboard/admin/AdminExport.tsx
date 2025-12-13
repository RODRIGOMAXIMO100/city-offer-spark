import { formatCentsToBRL } from '@/types/database';

interface ExportableUser {
  name: string;
  email?: string;
  role?: string;
  city: string;
  balance: number;
  created_at: string;
}

interface ExportableOffer {
  title: string;
  company_name?: string;
  city: string;
  clicks_count: number;
  views_count: number;
  leads_count: number;
  active: boolean;
  expires_at: string;
}

interface ExportableTransaction {
  user_name?: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('pt-BR');
};

const translateRole = (role?: string) => {
  const map: Record<string, string> = {
    'COMPANY': 'Empresa',
    'AFFILIATE': 'Divulgador',
    'CLIENT': 'Cliente'
  };
  return map[role || ''] || role || 'N/A';
};

const translateTransactionType = (type: string) => {
  const map: Record<string, string> = {
    'DEPOSIT': 'Depósito',
    'CLICK_COST': 'Custo Clique',
    'CLICK_EARNING': 'Ganho Clique',
    'LEAD_COST': 'Custo Lead',
    'LEAD_EARNING': 'Ganho Lead',
    'WITHDRAW': 'Saque',
    'PLATFORM_FEE': 'Taxa Plataforma'
  };
  return map[type] || type;
};

const escapeCSV = (value: string | number | boolean | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportUsers = (users: ExportableUser[]) => {
  const headers = ['Nome', 'Email', 'Tipo', 'Cidade', 'Saldo (R$)', 'Data Cadastro'];
  const rows = users.map(user => [
    user.name,
    user.email || '',
    translateRole(user.role),
    user.city,
    (user.balance / 100).toFixed(2), // centavos para reais
    formatDate(user.created_at)
  ]);
  
  downloadCSV('usuarios', headers, rows);
};

export const exportOffers = (offers: ExportableOffer[]) => {
  const headers = ['Título', 'Empresa', 'Cidade', 'Leads', 'Views', 'Cliques', 'Status', 'Expira em'];
  const rows = offers.map(offer => [
    offer.title,
    offer.company_name || '',
    offer.city,
    String(offer.leads_count || 0),
    String(offer.views_count),
    String(offer.clicks_count),
    offer.active ? 'Ativa' : 'Inativa',
    formatDate(offer.expires_at)
  ]);
  
  downloadCSV('ofertas', headers, rows);
};

export const exportTransactions = (transactions: ExportableTransaction[]) => {
  const headers = ['Usuário', 'Tipo', 'Valor (R$)', 'Descrição', 'Data/Hora'];
  const rows = transactions.map(tx => [
    tx.user_name || '',
    translateTransactionType(tx.type),
    (tx.amount / 100).toFixed(2), // centavos para reais
    tx.description || '',
    formatDateTime(tx.created_at)
  ]);
  
  downloadCSV('transacoes', headers, rows);
};