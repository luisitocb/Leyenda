import { render, fireEvent } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('renderiza su label y llama a onPress al pulsarlo', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Probar" onPress={onPress} />);

    fireEvent.press(getByText('Probar'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
