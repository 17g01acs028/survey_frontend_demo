"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-toastify";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function CreateQuestion() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const { push } = useRouter();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("short_text");
  const [required, setRequired] = useState(true);

  // Choice specific state
  const [options, setOptions] = useState<string[]>([""]);
  const [multipleChoice, setMultipleChoice] = useState(false);

  // File specific state
  const [fileFormat, setFileFormat] = useState(".pdf");
  const [maxFileSize, setMaxFileSize] = useState("1");
  const [maxFileSizeUnit, setMaxFileSizeUnit] = useState("mb");
  const [multipleFile, setMultipleFile] = useState(false);

  const handleAddOption = () => setOptions([...options, ""]);
  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };
  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build XML manually
      let xml = `<question>\n`;
      xml += `  <name>${name}</name>\n`;
      xml += `  <type>${type}</type>\n`;
      xml += `  <required>${required}</required>\n`;
      xml += `  <text>${text}</text>\n`;
      xml += `  <description>${description}</description>\n`;

      if (type === "choice") {
        xml += `  <frm_options>\n`;
        xml += `    <multiple>${multipleChoice ? "yes" : "no"}</multiple>\n`;
        xml += `    <values>\n`;
        options.forEach(opt => {
          xml += `      <value>${opt}</value>\n`;
        });
        xml += `    </values>\n`;
        xml += `  </frm_options>\n`;
      } else if (type === "file") {
        xml += `  <file_properties>\n`;
        xml += `    <format>${fileFormat}</format>\n`;
        xml += `    <max_file_size>${maxFileSize}</max_file_size>\n`;
        xml += `    <max_file_size_unit>${maxFileSizeUnit}</max_file_size_unit>\n`;
        xml += `    <multiple>${multipleFile ? "yes" : "no"}</multiple>\n`;
        xml += `  </file_properties>\n`;
      }

      xml += `</question>`;

      const response = await axios.post(`${url}/api/questions/new`, xml, {
        headers: { "Content-Type": "text/xml" }
      });

      if (response.status === 201) {
        toast.success("Question added successfully!");
        push("/");
      } else {
        toast.error("Failed to add question.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create a New Question</CardTitle>
          <CardDescription>Add a question to your survey.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Internal Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. q1, email_address"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="text">Question Text</Label>
              <Input
                id="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. What is your name?"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide extra context if needed..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={required}
                onCheckedChange={(checked) => setRequired(checked as boolean)}
              />
              <Label htmlFor="required">Is this question required?</Label>
            </div>

            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_text">Short Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="choice">Choice (Multiple/Single)</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "choice" && (
              <div className="p-4 border rounded space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multipleChoice"
                    checked={multipleChoice}
                    onCheckedChange={(checked) => setMultipleChoice(checked as boolean)}
                  />
                  <Label htmlFor="multipleChoice">Allow multiple selections (Checkbox)</Label>
                </div>
                
                <div className="space-y-2">
                  <Label>Options</Label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={opt}
                        onChange={e => handleOptionChange(i, e.target.value)}
                        required
                        placeholder={"Option " + (i + 1)}
                      />
                      {options.length > 1 && (
                        <Button type="button" variant="destructive" onClick={() => handleRemoveOption(i)}>Remove</Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={handleAddOption} className="mt-2">Add Option</Button>
                </div>
              </div>
            )}

            {type === "file" && (
              <div className="p-4 border rounded space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multipleFile"
                    checked={multipleFile}
                    onCheckedChange={(checked) => setMultipleFile(checked as boolean)}
                  />
                  <Label htmlFor="multipleFile">Allow multiple files</Label>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fileFormat">File Format (e.g. .pdf)</Label>
                  <Input
                    id="fileFormat"
                    value={fileFormat}
                    onChange={e => setFileFormat(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="grid gap-2 flex-1">
                    <Label htmlFor="maxFileSize">Max File Size</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={maxFileSize}
                      onChange={e => setMaxFileSize(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2 flex-1">
                    <Label>Unit</Label>
                    <Select value={maxFileSizeUnit} onValueChange={setMaxFileSizeUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kb">KB</SelectItem>
                        <SelectItem value="mb">MB</SelectItem>
                        <SelectItem value="gb">GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter>
            <Button disabled={loading} type="submit" className="w-full">
              {loading ? "Saving..." : "Create Question"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
