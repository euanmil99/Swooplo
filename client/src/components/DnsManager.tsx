import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Filter, Search, Trash2, PlusCircle } from 'lucide-react';

// DNS records for swooplo.com
const dnsRecords = [
  {
    type: 'A Record',
    host: '@',
    value: '23.236.62.147',
    ttl: 'Automatic',
    checked: true,
  },
  {
    type: 'CNAME Record',
    host: 'm',
    value: 'www245.wixdns.net',
    ttl: 'Automatic',
    checked: true,
  },
  {
    type: 'CNAME Record',
    host: 'www',
    value: 'www245.wixdns.net',
    ttl: 'Automatic',
    checked: true,
  },
];

const DnsManager: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">DNS Records for swooplo.com</h1>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <ChevronDown className="h-4 w-4" /> Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Delete Selected</DropdownMenuItem>
              <DropdownMenuItem>Export Records</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="flex items-center gap-1">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Input placeholder="Search" className="pl-8" />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>TTL</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dnsRecords.map((record, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Checkbox defaultChecked={record.checked} />
                </TableCell>
                <TableCell className="font-medium">{record.type}</TableCell>
                <TableCell>{record.host}</TableCell>
                <TableCell>{record.value}</TableCell>
                <TableCell>{record.ttl}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 pt-4 border-t">
        <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
          <PlusCircle className="h-4 w-4 mr-2" />
          ADD NEW RECORD
        </Button>
      </div>
    </div>
  );
};

export default DnsManager; 