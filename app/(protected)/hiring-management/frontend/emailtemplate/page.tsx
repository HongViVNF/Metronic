"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/app/frontend/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/app/frontend/components/ui/drawer';
import { Input } from '@/app/frontend/components/ui/input';
import { Label } from '@/app/frontend/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/frontend/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@radix-ui/react-tooltip'; // Adjusted import
import { toast } from 'sonner';
import { RichTextEditor } from '@/app/frontend/components/RichTextEditor';

// API functions
const fetchTemplates = async () => {
  const response = await fetch('/hiring-management/api/emailtemplate');
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

const createTemplate = async (data:any) => {
  const response = await fetch('/hiring-management/api/emailtemplate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

const updateTemplate = async (data:any) => {
  const response = await fetch('/hiring-management/api/emailtemplate', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

const deleteTemplate = async (id:any) => {
  const response = await fetch('/hiring-management/api/emailtemplate', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

// Extract variables from HTML content
const extractVariables = (html:any) => {
  const regex = /{{(\w+)}}/g;
  const matches = html.match(regex) || [];
  return Array.from(new Set(matches.map((match:any) => match.replace(/{{|}}/g, ''))));
};

export default function EmailTemplates() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', subject: '', body: '', type: '' });

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setOpen(false);
      setFormData({ name: '', subject: '', body: '', type: '' });
      toast.success('Template created successfully');
    },
    onError: (error) => toast.error(error.message),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setOpen(false);
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', body: '', type: '' });
      toast.success('Template updated successfully');
    },
    onError: (error) => toast.error(error.message),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => toast.error(error.message),
  });

  const logImagesFromBody = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const images = doc.querySelectorAll("img");
  
    images.forEach((img, index) => {
      console.log(`🖼️ Image ${index + 1}:`, {
        src: img.getAttribute("src"),
        width: img.getAttribute("width"),
        height: img.getAttribute("height"),
      });
    });
  };

  const handleSave = () => {
    const variables = extractVariables(formData.body);
    const data = { ...formData, variables };

    console.log("📤 Saving template:", data);
    logImagesFromBody(formData.body);

    if (editingTemplate) {
      updateMutation.mutate({ ...data, id: editingTemplate.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template:any) => {
    console.log("📝 Editing template:", template);
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type || '',
    });
    setOpen(true);
  };

  const handleDelete = (id:any) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => setOpen(true)}>Create Template</Button>
          </TooltipTrigger>
          <TooltipContent>Click to create a new email template</TooltipContent>
        </Tooltip>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {isLoading ? (
    <div className="col-span-full text-center">Loading...</div>
  ) : templates?.length ? (
    templates.map((template:any) => (
      <div key={template.id} className="border rounded-lg p-4 shadow-sm bg-white">
        <h3 className="font-semibold">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{template.name}</span>
            </TooltipTrigger>
            <TooltipContent>Template name: {template.name}</TooltipContent>
          </Tooltip>
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <strong>Subject:</strong> {template.subject}
              </span>
            </TooltipTrigger>
            <TooltipContent>Subject line of the email</TooltipContent>
          </Tooltip>
        </p>
        <p className="text-sm mt-2 line-clamp-3" dangerouslySetInnerHTML={{ __html: template.body }} />
        <p className="text-sm text-gray-600 mt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <strong>Variables:</strong> {template.variables?.join(', ') || '-'}
              </span>
            </TooltipTrigger>
            <TooltipContent>Dynamic fields: {template.variables?.join(', ') || 'None'}</TooltipContent>
          </Tooltip>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <strong>Type:</strong> {template.type || '-'}
              </span>
            </TooltipTrigger>
            <TooltipContent>Template category: {template.type || 'Not specified'}</TooltipContent>
          </Tooltip>
        </p>
        <div className="mt-4 flex justify-end space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={() => handleEdit(template)}>Edit</Button>
            </TooltipTrigger>
            <TooltipContent>Modify this template</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(template.id)}>Delete</Button>
            </TooltipTrigger>
            <TooltipContent>Remove this template</TooltipContent>
          </Tooltip>
        </div>
      </div>
    ))
  ) : (
    <div className="col-span-full text-center">No templates found</div>
  )}
</div>

      <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="fixed right-0 top-0 bottom-0 w-[600px] max-w-[100vw] p-6 bg-white rounded-l-xl shadow-xl flex flex-col overflow-y-auto overflow-x-hidden max-h-screen">
          <DrawerHeader>
            <DrawerTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DrawerTitle>
            <DrawerDescription>Fill in the details to create or update an email template.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </TooltipTrigger>
                <TooltipContent>Enter a unique name for the template</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </TooltipTrigger>
                <TooltipContent>Subject line for the email</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Template Type</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select
                    value={formData.type}
                    onValueChange={(value:any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Hợp đồng</SelectItem>
                      <SelectItem value="interview">Thư mời phỏng vấn</SelectItem>
                      <SelectItem value="test">Bài thi</SelectItem>
                      <SelectItem value="notification">Thông báo</SelectItem>
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent>Select the template category</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <RichTextEditor
                    value={formData.body}
                    onChange={(body) => setFormData({ ...formData, body })}
                  />
                </TooltipTrigger>
                <TooltipContent>Enter the email content with variables (e.g.)</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <DrawerFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setEditingTemplate(null);
                setFormData({ name: '', subject: '', body: '', type: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}