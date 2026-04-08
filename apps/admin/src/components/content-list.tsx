import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useStore } from '@nanostores/react';
import { $schema } from '../store/schema';
import { $router } from '../store/router';
import { 
  FileEdit as FileEditIcon, 
  Trash2 as Trash2Icon, 
  Loader2 as Loader2Icon, 
  Search as SearchIcon, 
  ChevronDown as ChevronDownIcon, 
  Filter as FilterIcon,
  LayoutGrid as LayoutGridIcon,
  List as ListIcon,
  History as HistoryIcon
} from 'lucide-react';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ContentList({ slug }: { slug: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: schema } = useStore($schema);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/content/${slug}`);
      const json = await response.json();
      setData(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [slug]);

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you certain? This action is irreversible.')) return;
    try {
      await apiFetch(`/api/content/${slug}/${id}`, { method: 'DELETE' });
      fetchContent();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center p-20 text-muted-foreground gap-6 bg-background border rounded-lg shadow-sm">
           <Loader2Icon className="size-8 animate-spin text-primary" />
           <p className="font-semibold text-[10px] uppercase tracking-[0.2em]">Synchronizing Data...</p>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      {/* Table Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64 group">
               <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground transition-colors" />
               <Input placeholder="Search entries..." className="pl-9 h-9 text-xs" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-semibold">
               <FilterIcon className="size-3.5" />
               Filter
            </Button>
         </div>

         <div className="flex items-center gap-1 border bg-muted/50 rounded-md p-0.5 border-border shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 bg-background shadow-sm text-primary">
               <ListIcon className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-foreground">
               <LayoutGridIcon className="size-3.5" />
            </Button>
         </div>
      </div>

      <Card className="shadow-none border-border overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-3 px-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                 <HistoryIcon className="size-3.5 opacity-50" />
                 Synchronized Ledger
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                 <span className="size-1.5 bg-primary rounded-full" />
                 <span>{data.length} Entries</span>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-muted-foreground uppercase text-[10px] font-bold tracking-wider bg-muted/20">
                <TableHead className="pl-6 py-3">Document Identification</TableHead>
                {schema?.fields?.slice(0, 2).map((field: any) => (
                  <TableHead key={field.id}>{field.label}</TableHead>
                ))}
                <TableHead>Created</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id} className="group transition-colors border-border/50">
                  <TableCell className="pl-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span 
                          className="font-semibold text-primary hover:underline cursor-pointer text-sm leading-tight"
                          onClick={() => $router.open(`/${slug}/${item.id}`)}
                        >
                          {item.slug || `Entry #${item.id}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium font-mono uppercase tracking-tighter opacity-70">ID: {item.id}</span>
                      </div>
                    </TableCell>
                    
                    {schema?.fields?.slice(0, 2).map((field: any) => (
                      <TableCell key={field.id} className="text-xs font-medium text-foreground/80">
                         {String(item[field.slug] || '—')}
                      </TableCell>
                    ))}

                    <TableCell className="text-[11px] text-muted-foreground font-medium">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-7 text-muted-foreground hover:text-primary"
                          onClick={() => $router.open(`/${slug}/${item.id}`)}
                         >
                            <FileEditIcon className="size-3.5" />
                         </Button>
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                       >
                          <Trash2Icon className="size-3.5" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-64 text-center text-muted-foreground bg-muted/5">
                    <div className="flex flex-col items-center justify-center gap-4">
                       <HistoryIcon className="size-12 opacity-10" />
                       <p className="text-sm font-semibold text-foreground/50">No Data Available</p>
                       <p className="text-[10px] uppercase font-semibold tracking-wider opacity-40">Add your first entry to begin</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Footer Info */}
      <div className="px-1 flex justify-between items-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
         <p>Showing 1 — {data.length} of {data.length}</p>
         <div className="flex gap-4">
            <span className="hover:text-primary cursor-pointer transition-colors">Previous</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Next</span>
         </div>
      </div>
    </div>
  );
}
