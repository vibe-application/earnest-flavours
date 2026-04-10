export type StoreId = 'fraser' | 'quebec' | 'frances' | 'northvan';

export interface Store {
  id: StoreId;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  color: string;
  bgColor: string;
}

export const stores: Store[] = [
  {
    id: 'fraser',
    name: 'Fraser Street',
    shortName: 'Fraser St',
    address: '3992 Fraser St, Vancouver, BC',
    phone: '604-428-0697',
    hours: 'Open daily 12-10p',
    description: 'Our very first shop! We\'ve been serving up scoops and pints here since 2013 and have loved being a part of the growing Fraserhood community.',
    color: 'text-store-fraser',
    bgColor: 'bg-store-fraser',
  },
  {
    id: 'quebec',
    name: 'Quebec Street',
    shortName: 'Quebec St',
    address: '1829 Quebec St, Vancouver, BC',
    phone: '778-379-0697',
    hours: 'Open daily 12-10p',
    description: 'Located near Olympic Village and the Seawall, in the historic Quigley Building. Award winning interior design by Janks Design Group.',
    color: 'text-store-quebec',
    bgColor: 'bg-store-quebec',
  },
  {
    id: 'frances',
    name: 'Frances Street',
    shortName: 'Frances St',
    address: '1485 Frances St, Vancouver, BC',
    phone: '604-428-2933',
    hours: 'Open daily 12-10p',
    description: 'This scoop shop is take-away only, but it\'s also where the magic happens — all of our ice creams are crafted onsite at this location. Built by Harmony Pacific, powered by 100% renewable natural gas.',
    color: 'text-store-frances',
    bgColor: 'bg-store-frances',
  },
  {
    id: 'northvan',
    name: 'North Vancouver',
    shortName: 'North Van',
    address: '127 W 1st St, North Vancouver, BC',
    phone: '',
    hours: 'Open daily 12-10p',
    description: 'Tucked into a beautiful street in Lower Lonsdale, dotted with some of our favourite cafes and restaurants. Come in to discover a favourite flavour or get your tried and true. We provide samples!',
    color: 'text-store-northvan',
    bgColor: 'bg-store-northvan',
  },
];

export const getStoreById = (id: StoreId): Store | undefined => {
  return stores.find(store => store.id === id);
};
