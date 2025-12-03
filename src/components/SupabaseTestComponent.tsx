"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEdgeFunctionErrorMessage } from '@/utils/error-utils';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';

interface TestData {
  id: string;
  test_value: string;
  created_at: string;
}

const SupabaseTestComponent: React.FC = () => {
  const { session } = useAuth();
  const [insertValue, setInsertValue] = useState('');
  const [updateId, setUpdateId] = useState('');
  const [updateValue, setUpdateValue] = useState('');
  const [deleteId, setDeleteId] = useState('');
  const [results, setResults] = useState<string | null>(null);
  const [testData, setTestData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(false);

  const invokeEdgeFunction = async (testType: string, payload: any = {}) => {
    setLoading(true);
    setResults(null);
    try {
      const response = await supabase.functions.invoke('test-write-operations', {
        body: JSON.stringify({ testType, payload }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      setResults(JSON.stringify(response.data, null, 2));
      toast.success(`${testType} successful!`);
      await fetchAllData(); // Refresh data after any write operation
    } catch (error: any) {
      const errorMessage = await getEdgeFunctionErrorMessage(error);
      setResults(`Error: ${errorMessage}`);
      toast.error(`${testType} failed`, { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setResults(null);
    try {
      const response = await supabase.functions.invoke('test-write-operations', {
        body: JSON.stringify({ testType: 'fetch_all' }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      setTestData(response.data.data || []);
      setResults(JSON.stringify(response.data, null, 2));
      toast.success('Fetched all data!');
    } catch (error: any) {
      const errorMessage = await getEdgeFunctionErrorMessage(error);
      setResults(`Error fetching data: ${errorMessage}`);
      toast.error('Failed to fetch data', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (session) {
      fetchAllData();
    }
  }, [session]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Write Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Current Test Data</h3>
          {loading && <p>Loading data...</p>}
          {!loading && testData.length === 0 && <p className="text-muted-foreground">No data found. Insert some!</p>}
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
            {testData.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm bg-muted p-2 rounded-sm">
                <span className="font-mono text-xs text-muted-foreground mr-2">{item.id.substring(0, 8)}...</span>
                <span className="flex-grow">{item.test_value}</span>
                <Button variant="ghost" size="sm" onClick={() => { setUpdateId(item.id); setUpdateValue(item.test_value); }} className="h-6 px-2">
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)} className="h-6 px-2 text-destructive">
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
          <Button onClick={fetchAllData} disabled={loading} className="w-full">
            <RefreshCw size={16} className="mr-2" /> Refresh Data
          </Button>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">Insert Data</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Value to insert"
              value={insertValue}
              onChange={(e) => setInsertValue(e.target.value)}
              disabled={loading}
            />
            <Button onClick={() => invokeEdgeFunction('insert', { value: insertValue })} disabled={loading || !insertValue.trim()}>
              <Plus size={16} className="mr-2" /> Insert
            </Button>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">Update Data</h3>
          <Input
            placeholder="ID to update"
            value={updateId}
            onChange={(e) => setUpdateId(e.target.value)}
            className="mb-2"
            disabled={loading}
          />
          <div className="flex gap-2">
            <Input
              placeholder="New value"
              value={updateValue}
              onChange={(e) => setUpdateValue(e.target.value)}
              disabled={loading}
            />
            <Button onClick={() => invokeEdgeFunction('update', { id: updateId, value: updateValue })} disabled={loading || !updateId.trim() || !updateValue.trim()}>
              <Pencil size={16} className="mr-2" /> Update
            </Button>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">Delete Data</h3>
          <div className="flex gap-2">
            <Input
              placeholder="ID to delete"
              value={deleteId}
              onChange={(e) => setDeleteId(e.target.value)}
              disabled={loading}
            />
            <Button onClick={() => invokeEdgeFunction('delete', { id: deleteId })} disabled={loading || !deleteId.trim()} variant="destructive">
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          </div>
        </div>

        {results && (
          <div className="space-y-2 border-t pt-6">
            <h3 className="text-lg font-semibold">Results</h3>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
              {results}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseTestComponent;