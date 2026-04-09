import { useStore } from '@nanostores/react';
import { $collections } from '../store/collections';
import { $router, navigate } from '../store/router';
import { useState } from 'react';
import {
  Database as DatabaseIcon,
  Plus as PlusIcon,
  Loader2 as Loader2Icon,
  Search as SearchIcon,
  Settings2 as Settings2Icon,
  ExternalLink as ExternalLinkIcon,
  MoreVertical as MoreVerticalIcon,
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { CollectionModal } from '../components/collection-modal';
import { Icon } from '../components/ui/icon-picker';

export function CollectionsPage() {
  const { data: collections, loading } = useStore($collections);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCollections = collections?.filter(
    (c) =>
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-container mx-auto space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <DatabaseIcon className="size-3" />
            <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">
              Infrastructure
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
            Data Collections
          </h1>
        </div>

        <CollectionModal>
          <Button
            size="sm"
            className="font-semibold h-9 px-6 text-xs"
          >
            <PlusIcon className="size-3.5 mr-2" />
            New Collection
          </Button>
        </CollectionModal>
      </header>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-muted/20 focus:bg-background border-border rounded-md text-sm"
          />
        </div>
        <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest bg-muted/10 px-3 py-2 rounded-md border">
          {collections?.length || 0} Registered Modules
        </div>
      </div>

      {/* Main Table */}
      <Card className="py-0 shadow-none border-border overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-muted-foreground uppercase text-[10px] font-bold tracking-wider bg-muted/20">
                <TableHead className="pl-8 py-4">Identity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Slug Identifier</TableHead>
                <TableHead className="text-right pr-8">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-60 text-center">
                    <Loader2Icon className="size-6 animate-spin mx-auto text-primary/40" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredCollections?.map((col) => (
                  <TableRow key={col.id} className="group border-border/50">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded bg-muted flex items-center justify-center border group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                          <Icon name={col.icon as any} className="size-5 opacity-40 group-hover:opacity-100" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span
                            className="font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer text-sm leading-none"
                            onClick={() => navigate('document_list', { slug: col.slug })}
                          >
                            {col.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                            Data Collection
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      PostgreSQL
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] font-mono font-bold bg-muted/50 border px-2 py-0.5 rounded text-muted-foreground uppercase">
                        {col.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider gap-2 hover:bg-muted"
                          onClick={() => navigate('document_list', { slug: col.slug })}
                        >
                          <ExternalLinkIcon className="size-3" />
                          Documents
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider gap-2"
                          onClick={() =>
                            navigate('collection', { id: col.id, slug: col.slug })
                          }
                        >
                          <Settings2Icon className="size-3" />
                          Structure
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {filteredCollections?.length === 0 && !loading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-60 text-center text-muted-foreground/30 bg-muted/5"
                  >
                    <DatabaseIcon className="size-12 mx-auto mb-4 opacity-5" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em]">
                      No collection found
                    </p>
                    <p className="text-[10px] mt-1 font-medium">
                      Create your first data collection to begin.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
