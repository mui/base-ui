"use client";

import { SearchIcon } from "lucide-react";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInputGroupContent,
  AutocompleteItem,
  AutocompleteList,
} from "@/registry/ui/autocomplete";
import { Button } from "@/registry/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/registry/ui/field";
import { Form } from "@/registry/ui/form";
import { toast } from "@/registry/ui/toast";

export function AutocompleteFormDemo() {
  return (
    <Form
      aria-label="Select a framework"
      onFormSubmit={(value) =>
        toast.success({
          description: JSON.stringify(value),
          title: "Form submitted",
        })
      }
    >
      <Field name="framework">
        <FieldLabel>Framework</FieldLabel>
        <FieldDescription>Select your favorite framework</FieldDescription>
        <Autocomplete items={tags} required>
          <AutocompleteInputGroupContent
            addonIcon={<SearchIcon />}
            aria-label="Search framework"
            className="w-64"
            placeholder="e.g. Next.js"
            showClear
            showTrigger
          />

          <AutocompleteContent>
            <AutocompleteEmpty>No tags found.</AutocompleteEmpty>
            <AutocompleteList>
              {(tag: Tag) => (
                <AutocompleteItem key={tag.id} value={tag}>
                  {tag.value}
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompleteContent>
        </Autocomplete>
        <FieldError>Framework is required</FieldError>
      </Field>
      <Button type="submit">Submit</Button>
    </Form>
  );
}

interface Tag {
  id: string;
  value: string;
}

const tags: Tag[] = [
  { id: "next-js", value: "Next.js" },
  { id: "react", value: "React" },
  { id: "vue", value: "Vue" },
  { id: "svelte", value: "Svelte" },
  { id: "svelteKit", value: "SvelteKit" },
  { id: "angular", value: "Angular" },
  { id: "solid", value: "Solid" },
  { id: "qwik", value: "Qwik" },
  { id: "remix", value: "Remix" },
];
