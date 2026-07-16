import React, { useEffect, useState } from 'react';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Boxes } from 'lucide-react';

const SystemSettings: React.FC = () => {
  const { value, isLoading, updateConfig } = useSystemConfig('estoque_baixo_limite');
  const [limite, setLimite] = useState('');

  useEffect(() => {
    if (value !== null && value !== undefined) {
      setLimite(value);
    }
  }, [value]);

  const handleSave = () => {
    const parsed = Number(limite);
    if (!Number.isInteger(parsed) || parsed < 0) return;
    updateConfig.mutate(String(parsed));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Boxes className="h-5 w-5" />
          Estoque
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="limite-estoque-baixo">Limite de "Estoque baixo"</Label>
            <div className="flex items-center gap-2">
              <Input
                id="limite-estoque-baixo"
                type="number"
                min={0}
                step={1}
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
              />
              <Button
                onClick={handleSave}
                disabled={updateConfig.isPending || limite === value}
              >
                {updateConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos com quantidade disponível igual ou menor que esse valor mostram o alerta
              "Estoque baixo".
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemSettings;
