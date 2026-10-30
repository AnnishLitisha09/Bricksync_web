export interface CommonStoreProps {
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (isOpen: boolean) => void;
  isDockMode: boolean;
  toggleDockMode: () => void;
  setDockMode: (isDockMode: boolean) => void;
}

export type CommonStoreSliceTypes = CommonStoreProps;

