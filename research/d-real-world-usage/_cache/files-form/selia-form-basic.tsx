import { Button } from 'components/selia/button';
import { Field, FieldError, FieldLabel } from 'components/selia/field';
import { Fieldset, FieldsetLegend } from 'components/selia/fieldset';
import { Form } from 'components/selia/form';
import { Input } from 'components/selia/input';
import { Text } from 'components/selia/text';

export default function FormBasicExample() {
  return (
    <Form className="w-full xl:w-8/12">
      <Fieldset>
        <FieldsetLegend>Personal Information</FieldsetLegend>
        <Text>We need your name and email to create your account.</Text>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" placeholder="Enter your name" required />
          <FieldError match="valueMissing">This is required</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" placeholder="Enter your email" required />
          <FieldError match="valueMissing">This is required</FieldError>
        </Field>
      </Fieldset>

      <Button type="submit" block>
        Create Account
      </Button>
    </Form>
  );
}
