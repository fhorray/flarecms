import React from 'react';
import { useStore } from '@nanostores/react';
import { $plugins } from '../store/plugins';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Puzzle, ShieldCheck, Zap } from 'lucide-react';

export function PluginManagerPage() {
  const { data: plugins, loading, error } = useStore($plugins);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-container mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Plugin Ecosystem</h1>
        <p className="text-muted-foreground max-w-2xl">
          Manage and monitor your FlareCMS extensions. Active plugins are
          isolated and gated by security capabilities.
        </p>
      </div>

      {error ? (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          Failed to load plugins: {error.message}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(plugins || []).map((plugin) => (
            <Card
              key={plugin.id}
              className="p-6 px-0 relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Puzzle className="size-12" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-widest font-bold"
                  >
                    v{plugin.version}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[10px] uppercase tracking-widest font-bold flex gap-1 items-center"
                  >
                    <Zap className="size-2.5" /> Active
                  </Badge>
                </div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {plugin.name}
                </CardTitle>
                <CardDescription>
                  Plugin module currently synchronized with host system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                      Granted Capabilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {plugin.capabilities.map((cap) => (
                        <Badge
                          key={cap}
                          variant="outline"
                          className="text-[9px] py-0 border-primary/20 bg-primary/5 text-primary"
                        >
                          <ShieldCheck className="size-2.5 mr-1" /> {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(plugins || []).length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl border-muted">
              <Puzzle className="size-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium">No plugins installed</h3>
              <p className="text-sm text-muted-foreground">
                Extensions will appear here once loaded into the system.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
