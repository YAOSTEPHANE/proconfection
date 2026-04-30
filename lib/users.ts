export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  status: "active" | "inactive";
  createdAt: string;
};

export const defaultUsers: UserRecord[] = [
  {
    id: "u-001",
    firstName: "Aicha",
    lastName: "Konan",
    email: "aicha.konan@example.com",
    phone: "+225 0700000001",
    city: "Abidjan",
    status: "active",
    createdAt: "2026-03-02T09:15:00.000Z",
  },
  {
    id: "u-002",
    firstName: "Moussa",
    lastName: "Traore",
    email: "moussa.traore@example.com",
    phone: "+225 0700000002",
    city: "Bouake",
    status: "active",
    createdAt: "2026-03-05T14:20:00.000Z",
  },
  {
    id: "u-003",
    firstName: "Nadia",
    lastName: "Bamba",
    email: "nadia.bamba@example.com",
    phone: "+225 0700000003",
    city: "Yamoussoukro",
    status: "inactive",
    createdAt: "2026-03-08T11:40:00.000Z",
  },
  {
    id: "u-004",
    firstName: "Koffi",
    lastName: "Nguessan",
    email: "koffi.nguessan@example.com",
    phone: "+225 0700000004",
    city: "San-Pedro",
    status: "active",
    createdAt: "2026-03-12T16:05:00.000Z",
  },
  {
    id: "u-005",
    firstName: "Mariam",
    lastName: "Coulibaly",
    email: "mariam.coulibaly@example.com",
    phone: "+225 0700000005",
    city: "Korhogo",
    status: "active",
    createdAt: "2026-03-15T08:55:00.000Z",
  },
  {
    id: "u-006",
    firstName: "Yao",
    lastName: "Kouassi",
    email: "yao.kouassi@example.com",
    phone: "+225 0700000006",
    city: "Daloa",
    status: "inactive",
    createdAt: "2026-03-18T18:12:00.000Z",
  },
];
