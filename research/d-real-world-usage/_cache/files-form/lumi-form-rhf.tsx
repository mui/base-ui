"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { FormInput } from "@/registry/components/form-input";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInputGroupContent,
  AutocompleteItem,
  AutocompleteList,
} from "@/registry/ui/autocomplete";
import { Button } from "@/registry/ui/button";
import { Checkbox } from "@/registry/ui/checkbox";
import { CheckboxGroup } from "@/registry/ui/checkbox-group";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInputGroupContent,
  ComboboxItemContent,
  ComboboxList,
} from "@/registry/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldItem,
  FieldLabel,
} from "@/registry/ui/field";
import { Fieldset, FieldsetLegend } from "@/registry/ui/fieldset";
import { Form } from "@/registry/ui/form";
import { NumberField } from "@/registry/ui/number-field";
import { Radio, RadioGroup } from "@/registry/ui/radio";
import {
  Select,
  SelectContent,
  SelectItemContent,
  SelectTriggerGroup,
} from "@/registry/ui/select";
import { Separator } from "@/registry/ui/separator";
import { Slider, SliderValue } from "@/registry/ui/slider";
import { Switch } from "@/registry/ui/switch";
import { ToastClose, toast } from "@/registry/ui/toast";

export const formSchema = z.object({
  additionalServices: z.array(z.string()),
  budgetRange: z
    .tuple([z.number().min(0), z.number().min(0)])
    .refine(([min, max]) => min <= max, {
      message: "Min budget must be <= max budget",
      path: [1],
    }),
  description: z.string(),
  location: z.object(
    { id: z.string(), name: z.string() },
    { error: "Location is required" },
  ),
  primaryTechStack: z.string().min(1, "Primary tech stack is required"),
  priority: z.string().min(1, "Priority is required"),
  projectName: z
    .string()
    .min(5, "Project name must be >= 5 characters")
    .max(100, "Project name must be <= 100 characters"),
  projectType: z.string().min(1, "Project type is required"),
  requireNda: z.boolean(),
  timeline: z.number().int().min(1).max(20).nullable(),
});

export type FormValues = z.infer<typeof formSchema>;

export const FormWithRHF = () => {
  const methods = useForm<FormValues>({
    defaultValues: {
      additionalServices: [],
      budgetRange: [5, 20],
      description: "",
      location: { id: "", name: "" },
      primaryTechStack: "",
      priority: "speed",
      projectName: "",
      projectType: "",
      requireNda: false,
      timeline: null,
    },
    resolver: zodResolver(formSchema),
    reValidateMode: "onSubmit",
  });
  async function submitForm(data: FormValues) {
    toast.add({
      customContent: (
        <div className="relative flex gap-2 p-2 bg-popover border text-popover-foreground rounded-md">
          <pre className="text-sm font-mono flex-1">
            {JSON.stringify(data, null, 2)}
          </pre>
          <ToastClose render={<Button size="icon-xs" variant="outline" />}>
            <XIcon />
          </ToastClose>
        </div>
      ),
      timeout: 0,
    });
  }
  return (
    <FormProvider {...methods}>
      <Form
        aria-label="Request project quote"
        className="w-full max-w-3xl mx-auto flex flex-col gap-6 rounded-md border p-4 sm:p-6 lg:p-8 shadow-md"
        onSubmit={methods.handleSubmit(submitForm)}
      >
        <div>
          <h2 className="text-xl font-bold tracking-tight">Project Inquiry</h2>
          <p className="text-sm text-muted-foreground">
            Tell us about your idea to get an estimated quote.
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <FormInput<FormValues>
            description="A short name for this project"
            isRequired
            label="Project Name"
            name="projectName"
            placeholder="New website"
          />
          <FormInput<FormValues>
            label="Description"
            multiline
            name="description"
            placeholder="Tell us about the project..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Controller
            control={methods.control}
            name="primaryTechStack"
            render={({
              field: { ref, name, value, onBlur, onChange },
              fieldState: { invalid, isTouched, isDirty, error },
            }) => (
              <Field
                dirty={isDirty}
                invalid={invalid}
                name={name}
                touched={isTouched}
              >
                <Autocomplete
                  items={FRAMEWORKS}
                  itemToStringValue={(item: Framework) => item.name}
                  mode="both"
                  onValueChange={onChange}
                  value={value}
                >
                  <FieldLabel aria-required>Preferred Framework</FieldLabel>
                  <AutocompleteInputGroupContent
                    className="w-full sm:w-64"
                    onBlur={onBlur}
                    placeholder="e.g. Next.js"
                    ref={ref}
                  />
                  <FieldDescription>
                    The core technology you want us to use.
                  </FieldDescription>
                  <AutocompleteContent>
                    <AutocompleteEmpty>No frameworks found.</AutocompleteEmpty>
                    <AutocompleteList>
                      {(fw: Framework) => (
                        <AutocompleteItem
                          className="flex-col justify-start items-start py-2"
                          key={fw.id}
                          value={fw}
                        >
                          <span className="font-medium text-sm">{fw.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {fw.description}
                          </span>
                        </AutocompleteItem>
                      )}
                    </AutocompleteList>
                  </AutocompleteContent>
                </Autocomplete>
                <FieldError match={!!error}>{error?.message}</FieldError>
              </Field>
            )}
          />
          <Controller
            control={methods.control}
            name="location"
            render={({
              field: { ref, name, value, onBlur, onChange },
              fieldState: { invalid, isTouched, isDirty, error },
            }) => {
              return (
                <Field
                  dirty={isDirty}
                  invalid={invalid}
                  name={name}
                  touched={isTouched}
                >
                  <Combobox<Location>
                    autoHighlight
                    isItemEqualToValue={(item, value) => item.id === value.id}
                    items={LOCATIONS}
                    itemToStringLabel={(item) => item.name}
                    onValueChange={onChange}
                    value={value}
                  >
                    <FieldLabel aria-required>Headquarters Location</FieldLabel>
                    <ComboboxInputGroupContent
                      className="w-full sm:w-64"
                      onBlur={onBlur}
                      placeholder="Select major city..."
                      ref={ref}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No location found</ComboboxEmpty>
                      <ComboboxList>
                        {(location: Location) => (
                          <ComboboxItemContent
                            key={location.id}
                            value={location}
                          >
                            {location.name}
                          </ComboboxItemContent>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FieldError match={!!error}>{error?.message}</FieldError>
                </Field>
              );
            }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Controller
            control={methods.control}
            name="projectType"
            render={({
              field: { ref, name, value, onBlur, onChange },
              fieldState: { invalid, isTouched, isDirty, error },
            }) => (
              <Field
                dirty={isDirty}
                invalid={invalid}
                name={name}
                touched={isTouched}
              >
                <FieldLabel aria-required>Type</FieldLabel>
                <Select
                  inputRef={ref}
                  items={PROJECT_TYPES}
                  onValueChange={onChange}
                  value={value}
                >
                  <SelectTriggerGroup
                    className="w-full sm:w-64"
                    indicatorIcon={<ChevronsUpDownIcon />}
                    onBlur={onBlur}
                    placeholder="Marketing Website"
                  />
                  <SelectContent>
                    {PROJECT_TYPES.map(({ label, value }) => (
                      <SelectItemContent key={value} value={value}>
                        {label}
                      </SelectItemContent>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError match={!!error}>{error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            control={methods.control}
            name="timeline"
            render={({
              field: { ref, name, value, onBlur, onChange },
              fieldState: { invalid, isTouched, isDirty, error },
            }) => (
              <Field
                className="w-full sm:w-64"
                dirty={isDirty}
                invalid={invalid}
                name={name}
                touched={isTouched}
              >
                <FieldLabel>Timeline(weeks)</FieldLabel>
                <NumberField
                  inputRef={ref}
                  max={20}
                  min={1}
                  onBlur={onBlur}
                  onValueChange={onChange}
                  value={value}
                />
                <FieldError match={!!error}>{error?.message}</FieldError>
              </Field>
            )}
          />
        </div>
        <Controller
          control={methods.control}
          name="budgetRange"
          render={({
            field: { ref, name, value, onBlur, onChange },
            fieldState: { invalid, isTouched, isDirty, error },
          }) => (
            <Field
              dirty={isDirty}
              invalid={invalid}
              name={name}
              touched={isTouched}
            >
              <Fieldset>
                <FieldsetLegend>Budget Range</FieldsetLegend>
                <Slider
                  className="pt-2 w-full"
                  inputRef={ref}
                  max={100}
                  min={1}
                  onBlur={onBlur}
                  onValueChange={onChange}
                  onValueCommitted={onChange}
                  step={1}
                  thumbAlignment="edge"
                  value={value}
                >
                  <SliderValue className="text-muted-foreground">
                    {(_, values) => {
                      const [min, max] = values;
                      const formatter = new Intl.NumberFormat("en-US", {
                        currency: "USD",
                        maximumFractionDigits: 0,
                        style: "currency",
                      });
                      return `${formatter.format(min * 1000)} – ${formatter.format(
                        max * 1000,
                      )}`;
                    }}
                  </SliderValue>
                </Slider>
              </Fieldset>
              <FieldError match={!!error}>{error?.message}</FieldError>
            </Field>
          )}
        />
        <Separator />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Controller
            control={methods.control}
            name="priority"
            render={({
              field: { ref, name, value, onBlur, onChange },
              fieldState: { invalid, isTouched, isDirty, error },
            }) => (
              <Field
                dirty={isDirty}
                invalid={invalid}
                name={name}
                touched={isTouched}
              >
                <Fieldset
                  render={
                    <RadioGroup
                      className="flex flex-col gap-3"
                      defaultValue="quality"
                      inputRef={ref}
                      onValueChange={onChange}
                      value={value}
                    />
                  }
                >
                  <FieldsetLegend>Primary Priority</FieldsetLegend>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: "speed", label: "Speed" },
                      { id: "quality", label: "Quality" },
                      { id: "budget", label: "Cost" },
                    ].map((item) => (
                      <FieldItem key={item.id}>
                        <FieldLabel>
                          <Radio onBlur={onBlur} value={item.id} />
                          {item.label}
                        </FieldLabel>
                      </FieldItem>
                    ))}
                  </div>
                </Fieldset>
                <FieldError match={!!error}>{error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            control={methods.control}
            name="additionalServices"
            render={({
              field: { ref, name, value, onBlur, onChange },
              fieldState: { invalid, isTouched, isDirty, error },
            }) => (
              <Field
                className="flex flex-col! gap-3!"
                dirty={isDirty}
                invalid={invalid}
                name={name}
                touched={isTouched}
              >
                <Fieldset
                  render={
                    <CheckboxGroup onValueChange={onChange} value={value} />
                  }
                >
                  <FieldsetLegend aria-required>
                    Included Services
                  </FieldsetLegend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "design", label: "UI/UX Design" },
                      { id: "seo", label: "SEO Setup" },
                      { id: "analytics", label: "Analytics" },
                      { id: "cms", label: "CMS Integration" },
                    ].map((s) => (
                      <FieldItem key={s.id}>
                        <FieldLabel>
                          <Checkbox
                            inputRef={s.id === "design" ? ref : undefined}
                            onBlur={onBlur}
                            value={s.id}
                          />
                          {s.label}
                        </FieldLabel>
                      </FieldItem>
                    ))}
                  </div>
                </Fieldset>
                <FieldError match={!!error}>{error?.message}</FieldError>
              </Field>
            )}
          />
        </div>
        <Controller
          control={methods.control}
          name="requireNda"
          render={({
            field: { ref, name, value, onBlur, onChange },
            fieldState: { invalid, isTouched, isDirty },
          }) => (
            <Field
              dirty={isDirty}
              invalid={invalid}
              name={name}
              touched={isTouched}
            >
              <FieldLabel className="flex w-full justify-between items-center rounded-lg border p-3 shadow-sm">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Require NDA</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Legal agreement before starting
                  </span>
                </span>
                <Switch
                  checked={value}
                  inputRef={ref}
                  onBlur={onBlur}
                  onCheckedChange={onChange}
                />
              </FieldLabel>
            </Field>
          )}
        />
        <div className="pt-2">
          <Button type="submit">Submit</Button>
        </div>
      </Form>
    </FormProvider>
  );
};

interface Location {
  id: string;
  name: string;
}

const LOCATIONS = [
  { id: "san-francisco", name: "San Francisco, CA" },
  { id: "new-york", name: "New York, NY" },
  { id: "austin", name: "Austin, TX" },
  { id: "london", name: "London, UK" },
  { id: "berlin", name: "Berlin, DE" },
  { id: "toronto", name: "Toronto, CA" },
  { id: "shanghai", name: "Shanghai, CN" },
  { id: "singapore", name: "Singapore, SG" },
  { id: "sydney", name: "Sydney, AU" },
  { id: "remote", name: "Remote (Worldwide)" },
];

interface Framework {
  id: string;
  name: string;
  description: string;
}

const FRAMEWORKS: Framework[] = [
  { description: "Standard UI Library", id: "react", name: "React" },
  { description: "Full-stack React Framework", id: "nextjs", name: "Next.js" },
  { description: "Progressive Framework", id: "vue", name: "Vue.js" },
  { description: "Cybernetically enhanced apps", id: "svelte", name: "Svelte" },
  { description: "Enterprise-ready platform", id: "angular", name: "Angular" },
  { description: "Content-focused websites", id: "astro", name: "Astro" },
];

const PROJECT_TYPES = [
  { label: "Marketing Website", value: "marketing" },
  { label: "E-commerce Store", value: "ecommerce" },
  { label: "Web Application", value: "webapp" },
  { label: "Mobile App (iOS/Android)", value: "mobile" },
  { label: "Internal Dashboard", value: "dashboard" },
];
