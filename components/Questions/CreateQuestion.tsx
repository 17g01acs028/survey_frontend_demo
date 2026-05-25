"use client";

import { useState, useEffect } from "react";
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
import parser from "xml2js";
import { ArrowUp, ArrowDown } from "lucide-react";
import Loading from "@/components/Questions/Loading";

export default function CreateQuestion({ surveyId }: { surveyId: string }) {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const { push } = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  // Range specific state
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(10);
  const [rangeStep, setRangeStep] = useState(1);

  // Rate specific state
  const [rateMax, setRateMax] = useState(5);

  const fetchQuestions = () => {
    setFetching(true);
    fetch(`${url}/api/questions/${surveyId}`)
      .then(res => res.text())
      .then(xmlData => {
        parser.parseString(xmlData, (err, result) => {
          if (!err && result && result.questions && result.questions.question) {
            let qData = result.questions.question;
            if (!Array.isArray(qData)) qData = [qData];
            setQuestions(qData);
          } else {
            setQuestions([]);
          }
          setFetching(false);
        });
      })
      .catch(err => {
        console.error(err);
        setFetching(false);
      });
  };

  useEffect(() => {
    fetchQuestions();
  }, [surveyId, url]);

  const handleEdit = (q: any) => {
    setEditingId(q.$.id || null);
    setName(q.$.name || "");
    setType(q.$.type || "short_text");
    setRequired(q.$.required === "yes");
    setText(q.text ? q.text[0] : "");
    setDescription(q.description && q.description[0] ? q.description[0] : "");
    
    if (q.$.type === "choice" && q.options && q.options[0]) {
      setMultipleChoice(q.options[0].$.multiple === "yes");
      const vals = q.options[0].option;
      if (vals) {
        setOptions(vals.map((v: any) => v._ || v));
      } else {
        setOptions([""]);
      }
    } else {
      setOptions([""]);
    }
    
    if (q.$.type === "file" && q.file_properties && q.file_properties[0]) {
      const fp = q.file_properties[0].$;
      setFileFormat(fp.format || ".pdf");
      setMaxFileSize(fp.max_file_size || "1");
      setMaxFileSizeUnit(fp.max_file_size_unit || "mb");
      setMultipleFile(fp.multiple === "yes");
    }
    if (q.$.type === "range" && q.range_properties && q.range_properties[0]) {
      const rp = q.range_properties[0].$;
      setRangeMin(Number(rp.min) || 0);
      setRangeMax(Number(rp.max) || 10);
      setRangeStep(Number(rp.step) || 1);
    }
    
    if (q.$.type === "rate" && q.rate_properties && q.rate_properties[0]) {
      const rp = q.rate_properties[0].$;
      setRateMax(Number(rp.max) || 5);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await axios.delete(`${url}/api/questions/delete/${id}`);
      toast.success("Question deleted!");
      fetchQuestions();
    } catch (err) {
      toast.error("Failed to delete question.");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setText("");
    setDescription("");
    setType("short_text");
    setRequired(true);
    setOptions([""]);
    setRangeMin(0);
    setRangeMax(10);
    setRangeStep(1);
    setRateMax(5);
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the questions in local state
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[swapIndex];
    newQuestions[swapIndex] = temp;
    
    setQuestions(newQuestions);

    // Prepare payload for backend: map to [{ id, order }] based on new array order
    const payload = newQuestions.map((q, i) => ({
      id: q.$.id,
      order: i
    }));

    try {
      await axios.put(`${url}/api/questions/reorder`, payload);
      toast.success("Questions reordered");
    } catch (err) {
      toast.error("Failed to save new order");
      fetchQuestions(); // Revert on failure
    }
  };

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
      } else if (type === "range") {
        xml += `  <range_properties>\n`;
        xml += `    <min>${rangeMin}</min>\n`;
        xml += `    <max>${rangeMax}</max>\n`;
        xml += `    <step>${rangeStep}</step>\n`;
        xml += `  </range_properties>\n`;
      } else if (type === "rate") {
        xml += `  <rate_properties>\n`;
        xml += `    <max>${rateMax}</max>\n`;
        xml += `  </rate_properties>\n`;
      }

      xml += `</question>`;

      if (editingId) {
        const response = await axios.put(`${url}/api/questions/update/${editingId}`, xml, {
          headers: { "Content-Type": "text/xml" }
        });
        if (response.status === 200) {
          toast.success("Question updated successfully!");
          cancelEdit();
          fetchQuestions();
        } else {
          toast.error("Failed to update question.");
        }
      } else {
        const response = await axios.post(`${url}/api/questions/${surveyId}/new`, xml, {
          headers: { "Content-Type": "text/xml" }
        });
        if (response.status === 201) {
          toast.success("Question added successfully!");
          cancelEdit();
          fetchQuestions();
        } else {
          toast.error("Failed to add question.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full max-w-6xl mx-auto">
      {/* Editor Column */}
      <Card className="w-full">
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
                  <SelectItem value="range">Range Slider</SelectItem>
                  <SelectItem value="rate">Star Rating</SelectItem>
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

            {type === "range" && (
              <div className="p-4 border rounded space-y-4 flex flex-col md:flex-row gap-4">
                <div className="grid gap-2 flex-1">
                  <Label htmlFor="rangeMin">Minimum Value</Label>
                  <Input
                    id="rangeMin"
                    type="number"
                    value={rangeMin}
                    onChange={e => setRangeMin(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2 flex-1">
                  <Label htmlFor="rangeMax">Maximum Value</Label>
                  <Input
                    id="rangeMax"
                    type="number"
                    value={rangeMax}
                    onChange={e => setRangeMax(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2 flex-1">
                  <Label htmlFor="rangeStep">Step</Label>
                  <Input
                    id="rangeStep"
                    type="number"
                    value={rangeStep}
                    onChange={e => setRangeStep(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {type === "rate" && (
              <div className="p-4 border rounded space-y-4">
                <div className="grid gap-2 max-w-xs">
                  <Label htmlFor="rateMax">Maximum Rating (Stars)</Label>
                  <Input
                    id="rateMax"
                    type="number"
                    value={rateMax}
                    min={1}
                    max={10}
                    onChange={e => setRateMax(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="flex justify-between">
            {editingId && (
              <Button type="button" variant="outline" onClick={cancelEdit}>Cancel Edit</Button>
            )}
            <Button disabled={loading} type="submit" className={editingId ? "flex-1 ml-4" : "w-full"}>
              {loading ? "Saving..." : (editingId ? "Update Question" : "Create Question")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Preview Column */}
      <Card className="w-full sticky top-24">
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>This is how the question will appear to respondents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border p-6 rounded-md bg-gray-50 dark:bg-zinc-900 shadow-sm space-y-4">
            <div>
              <Label className="text-base font-semibold">
                {text || "Question Text Goes Here"}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
            </div>

            <div className="mt-4">
              {type === "short_text" && (
                <Input placeholder="Respondent's answer..." disabled />
              )}
              {type === "email" && (
                <Input type="email" placeholder="example@email.com" disabled />
              )}
              {type === "choice" && multipleChoice && (
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox disabled />
                      <Label className="text-sm font-normal">{opt || `Option ${i + 1}`}</Label>
                    </div>
                  ))}
                </div>
              )}
              {type === "choice" && !multipleChoice && (
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input type="radio" id={`preview-opt-${i}`} disabled name="preview-radio" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" />
                      <Label htmlFor={`preview-opt-${i}`} className="text-sm font-normal">{opt || `Option ${i + 1}`}</Label>
                    </div>
                  ))}
                </div>
              )}
              {type === "file" && (
                <div className="border-2 border-dashed p-6 text-center rounded-md text-gray-400 bg-white dark:bg-black">
                  <p>Click to upload or drag and drop</p>
                  <p className="text-xs mt-2">
                    {fileFormat} up to {maxFileSize}{maxFileSizeUnit.toUpperCase()}
                  </p>
                </div>
              )}
              {type === "range" && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{rangeMin}</span>
                    <span>{rangeMax}</span>
                  </div>
                  <input 
                    type="range" 
                    min={rangeMin} 
                    max={rangeMax} 
                    step={rangeStep} 
                    disabled 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed dark:bg-gray-700" 
                  />
                </div>
              )}
              {type === "rate" && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  {Array.from({ length: rateMax }).map((_, i) => (
                    <svg key={i} className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Existing Questions List */}
      <Card className="w-full md:col-span-2 mt-8">
        <CardHeader>
          <CardTitle>Current Questions</CardTitle>
          <CardDescription>Manage the questions currently in this survey.</CardDescription>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <Loading />
          ) : questions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No questions added yet.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={q.$.id || i} className={`p-4 border rounded-lg flex items-center justify-between ${editingId === q.$.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}>
                  <div>
                    <h3 className="font-semibold text-lg">{q.text && q.text[0]} {q.$.required === 'yes' && <span className="text-red-500">*</span>}</h3>
                    <p className="text-sm text-gray-500">
                      Internal Name: <span className="font-mono">{q.$.name}</span> | Type: {q.$.type}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col space-y-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => handleReorder(i, 'up')}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === questions.length - 1} onClick={() => handleReorder(i, 'down')}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(q)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(q.$.id)}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
