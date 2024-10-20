// import * as React from 'react';
// import { Select } from '@base_ui/react/Select';
// import { screen } from '@mui/internal-test-utils';
// import { createRenderer, describeConformance } from '#test-utils';
// import { expect } from 'chai';

// describe('<Select.Value />', () => {
//   const { render } = createRenderer();

//   describeConformance(<Select.Value />, () => ({
//     refInstanceof: window.HTMLSpanElement,
//     render(node) {
//       return render(
//         <Select.Root open animated={false}>
//           {node}
//         </Select.Root>,
//       );
//     },
//   }));

//   describe('prop: placeholder', () => {
//     it('should render the placeholder when value is empty', async () => {
//       await render(
//         <Select.Root>
//           <Select.Value placeholder="test" />
//         </Select.Root>,
//       );
//       expect(screen.getByText('test')).not.to.equal(null);
//     });

//     it('should render the value when value is not empty', async () => {
//       await render(
//         <Select.Root defaultValue="two">
//           <Select.Value placeholder="one" data-testid="value" />
//           <Select.Positioner>
//             <Select.Option value="" />
//             <Select.Option value="two">two</Select.Option>
//           </Select.Positioner>
//         </Select.Root>,
//       );

//       const value = screen.getByTestId('value');
//       expect(value.textContent).to.equal('two');
//     });
//   });
// });
