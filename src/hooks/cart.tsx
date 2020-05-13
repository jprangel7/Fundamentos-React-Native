import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem('GoMarketplace:cart');

      if (data) {
        setProducts(JSON.parse(data));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const product = products.find(item => item.id === id);
      if (product) {
        product.quantity += 1;
        const newData = products.filter(item => item.id !== id);
        setProducts([...newData, product]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      if (products.some(item => item.id === product.id)) {
        increment(product.id);
      } else {
        const newProduct = {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price: product.price,
          quantity: 1,
        };

        setProducts([...products, newProduct]);

        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(products),
        );
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(item => item.id === id);
      if (product && product.quantity > 1) {
        product.quantity -= 1;

        const newData = products.filter(item => item.id !== id);

        setProducts([...newData, product]);
      } else if (product && product.quantity === 1) {
        setProducts(products.filter(item => item.id !== id));
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
