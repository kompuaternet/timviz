import { promises as fs } from "fs";
import path from "path";
import {
  decorateBusinessWithPublicBookingLink,
  ensureServiceForProfessional,
  getBusinessDirectorySnapshot,
  getWorkspaceSnapshot,
  resolveMembershipSchedule
} from "./pro-data";
import type {
  MembershipRecord,
  ProfessionalRecord,
  ServiceRecord,
  WorkspaceSnapshot
} from "./pro-data";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type CalendarAppointmentKind = "appointment" | "blocked";
export type CalendarAttendanceStatus = "pending" | "confirmed" | "arrived" | "no_show";

export type CalendarAppointment = {
  id: string;
  businessId: string;
  professionalId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  kind: CalendarAppointmentKind;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  notes: string;
  attendance: CalendarAttendanceStatus;
  priceAmount: number;
  createdAt: string;
};

export type CalendarPeriodStats = {
  visitsCount: number;
  revenue: number;
};

export type CalendarClient = {
  name: string;
  phone: string;
};

export type CalendarViewer = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  scope: "owner" | "member";
  language?: string;
  country?: string;
  currency?: string;
};

export type CalendarTeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  scope: "owner" | "member";
  isViewer: boolean;
};

export type CalendarMemberDaySnapshot = {
  professionalId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  scope: "owner" | "member";
  isViewer: boolean;
  memberSchedule: WorkspaceSnapshot["memberSchedule"];
  appointments: CalendarAppointment[];
};

export type CalendarRecentActivity = {
  id: string;
  appointmentDate: string;
  startTime: string;
  customerName: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  createdAt: string;
};

export type ClientDirectoryEntry = {
  id: string;
  name: string;
  phone: string;
  visitsCount: number;
  totalSales: number;
  createdAt: string;
};

export type PublicCalendarAppointment = Pick<
  CalendarAppointment,
  "businessId" | "professionalId" | "appointmentDate" | "startTime" | "endTime" | "kind" | "attendance"
>;

type CalendarStore = {
  appointments: CalendarAppointment[];
};

type CalendarAppointmentRow = {
  id: string;
  business_id: string;
  professional_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  kind?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  service_name?: string | null;
  notes?: string | null;
  attendance?: string | null;
  price_amount?: number | null;
  created_at: string;
};

const storePath = path.join(process.cwd(), "data", "pro-calendar.json");

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeKind(value: unknown): CalendarAppointmentKind {
  return value === "blocked" ? "blocked" : "appointment";
}

function normalizeAttendance(value: unknown): CalendarAttendanceStatus {
  return value === "confirmed" || value === "arrived" || value === "no_show" ? value : "pending";
}

function normalizeAppointment(
  appointment: Partial<CalendarAppointment> & {
    id: string;
    businessId: string;
    professionalId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    createdAt: string;
  }
): CalendarAppointment {
  return {
    id: appointment.id,
    businessId: appointment.businessId,
    professionalId: appointment.professionalId,
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    kind: normalizeKind(appointment.kind),
    customerName: appointment.customerName?.trim() ?? "",
    customerPhone: appointment.customerPhone?.trim() ?? "",
    serviceName: appointment.serviceName?.trim() ?? "",
    notes: appointment.notes?.trim() ?? "",
    attendance: normalizeAttendance(appointment.attendance),
    priceAmount:
      typeof appointment.priceAmount === "number" && Number.isFinite(appointment.priceAmount)
        ? Math.max(0, appointment.priceAmount)
        : 0,
    createdAt: appointment.createdAt
  };
}

function mapSupabaseAppointment(row: CalendarAppointmentRow): CalendarAppointment {
  return normalizeAppointment({
    id: row.id,
    businessId: row.business_id,
    professionalId: row.professional_id,
    appointmentDate: row.appointment_date,
    startTime: row.start_time,
    endTime: row.end_time,
    kind: normalizeKind(row.kind),
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    serviceName: row.service_name ?? "",
    notes: row.notes ?? "",
    attendance: normalizeAttendance(row.attendance),
    priceAmount: row.price_amount ?? 0,
    createdAt: row.created_at
  });
}

async function ensureStore() {
  try {
    await fs.access(storePath);
  } catch {
    const initial: CalendarStore = { appointments: [] };
    await fs.writeFile(storePath, JSON.stringify(initial, null, 2) + "\n", "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const file = await fs.readFile(storePath, "utf8");
  const parsed = JSON.parse(file) as Partial<CalendarStore>;
  const appointments = Array.isArray(parsed.appointments) ? parsed.appointments : [];

  return {
    appointments: appointments
      .map((appointment) => {
        if (!appointment?.id || !appointment.businessId || !appointment.professionalId) {
          return null;
        }

        return normalizeAppointment({
          id: appointment.id,
          businessId: appointment.businessId,
          professionalId: appointment.professionalId,
          appointmentDate: appointment.appointmentDate ?? "",
          startTime: appointment.startTime ?? "",
          endTime: appointment.endTime ?? "",
          kind: appointment.kind ?? "appointment",
          customerName: appointment.customerName ?? "",
          customerPhone: appointment.customerPhone ?? "",
          serviceName: appointment.serviceName ?? "",
          notes: appointment.notes ?? "",
          attendance: appointment.attendance ?? "pending",
          priceAmount:
            typeof appointment.priceAmount === "number"
              ? appointment.priceAmount
              : appointment.kind === "blocked"
                ? 0
                : 0,
          createdAt: appointment.createdAt ?? new Date(0).toISOString()
        });
      })
      .filter((appointment): appointment is CalendarAppointment => Boolean(appointment))
  } satisfies CalendarStore;
}

async function writeStore(data: CalendarStore) {
  await fs.writeFile(storePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function readAppointmentsForProfessional(professionalId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("calendar_appointments")
      .select(
        "id, business_id, professional_id, appointment_date, start_time, end_time, kind, customer_name, customer_phone, service_name, notes, attendance, price_amount, created_at"
      )
      .eq("professional_id", professionalId)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapSupabaseAppointment(row as CalendarAppointmentRow));
  }

  const store = await readStore();
  return store.appointments
    .filter((appointment) => appointment.professionalId === professionalId)
    .sort(
      (left, right) =>
        `${left.appointmentDate}${left.startTime}${left.createdAt}`.localeCompare(
          `${right.appointmentDate}${right.startTime}${right.createdAt}`
        )
    );
}

export async function getAppointmentsForBusiness(businessId: string) {
  if (!businessId.trim()) {
    return [];
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("calendar_appointments")
      .select(
        "id, business_id, professional_id, appointment_date, start_time, end_time, kind, customer_name, customer_phone, service_name, notes, attendance, price_amount, created_at"
      )
      .eq("business_id", businessId)
      .order("appointment_date", { ascending: false })
      .order("start_time", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapSupabaseAppointment(row as CalendarAppointmentRow));
  }

  const store = await readStore();
  return store.appointments
    .filter((appointment) => appointment.businessId === businessId)
    .sort((left, right) =>
      `${right.appointmentDate}${right.startTime}${right.createdAt}`.localeCompare(
        `${left.appointmentDate}${left.startTime}${left.createdAt}`
      )
    );
}

export async function getPublicCalendarAppointments(): Promise<PublicCalendarAppointment[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("calendar_appointments")
      .select("business_id, professional_id, appointment_date, start_time, end_time, kind, attendance")
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      businessId: row.business_id,
      professionalId: row.professional_id,
      appointmentDate: row.appointment_date,
      startTime: row.start_time,
      endTime: row.end_time,
      kind: normalizeKind(row.kind),
      attendance: normalizeAttendance(row.attendance)
    }));
  }

  const store = await readStore();
  return store.appointments.map((appointment) => ({
    businessId: appointment.businessId,
    professionalId: appointment.professionalId,
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    kind: appointment.kind,
    attendance: appointment.attendance
  }));
}

function getWeekRange(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const dayIndex = (date.getDay() + 6) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - dayIndex);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

function getMonthRange(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

function summarizeAppointments(
  appointments: CalendarAppointment[],
  startDate: string,
  endDate: string
): CalendarPeriodStats {
  const visits = appointments.filter(
    (appointment) =>
      appointment.kind === "appointment" &&
      appointment.attendance !== "pending" &&
      appointment.appointmentDate >= startDate &&
      appointment.appointmentDate <= endDate
  );

  return {
    visitsCount: visits.length,
    revenue: visits.reduce((sum, appointment) => sum + (appointment.priceAmount || 0), 0)
  };
}

function addMinutes(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(total / 60);
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function getDefaultDuration(serviceName: string, services: ServiceRecord[]) {
  const match = services.find((service) => service.name === serviceName);

  if (!match) {
    return 60;
  }

  if (
    /окраш|наращ|укреп|комплекс|педикюр|массаж|спа|пилинг|терап/i.test(match.name)
  ) {
    return 90;
  }

  return 60;
}

function buildProfessionalLabel(professional: Pick<ProfessionalRecord, "firstName" | "lastName" | "email">) {
  const fullName = `${professional.firstName} ${professional.lastName}`.trim();
  return fullName || professional.email || "Specialist";
}

function buildWorkspaceSnapshotFromDirectory(
  professional: ProfessionalRecord,
  membership: MembershipRecord,
  business: WorkspaceSnapshot["business"],
  services: ServiceRecord[],
  businesses: Pick<WorkspaceSnapshot["business"], "id" | "name" | "createdAt">[]
): WorkspaceSnapshot {
  const decoratedBusiness = decorateBusinessWithPublicBookingLink(
    business,
    businesses
  );

  return {
    professional,
    business: decoratedBusiness,
    membership,
    memberSchedule: resolveMembershipSchedule(membership, decoratedBusiness),
    services
  };
}

async function resolveCalendarAccess(input: {
  viewerProfessionalId: string;
  targetProfessionalId?: string;
  strictTarget?: boolean;
}) {
  const viewerWorkspace = await getWorkspaceSnapshot(input.viewerProfessionalId);

  if (!viewerWorkspace) {
    throw new Error("Workspace not found.");
  }

  const directory = await getBusinessDirectorySnapshot();
  const business = directory.businesses.find((item) => item.id === viewerWorkspace.business.id);

  if (!business) {
    throw new Error("Business not found.");
  }

  const services = directory.services
    .filter((item) => item.businessId === business.id && item.isBlocked !== true)
    .sort((left, right) => {
      const orderDiff = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
      return orderDiff || left.createdAt.localeCompare(right.createdAt);
    });

  const teamEntries = directory.memberships
    .filter((membership) => membership.businessId === business.id && membership.scope !== "pending")
    .map((membership) => {
      const professional = directory.professionals.find((item) => item.id === membership.professionalId);
      if (!professional || professional.accountStatus !== "active") {
        return null;
      }

      return { professional, membership };
    })
    .filter(
      (entry): entry is { professional: ProfessionalRecord; membership: MembershipRecord } => Boolean(entry)
    )
    .sort((left, right) => {
      const scopeWeight = left.membership.scope === right.membership.scope ? 0 : left.membership.scope === "owner" ? -1 : 1;
      if (scopeWeight !== 0) {
        return scopeWeight;
      }

      return buildProfessionalLabel(left.professional).localeCompare(buildProfessionalLabel(right.professional), "ru");
    });

  const canManageTeam = viewerWorkspace.membership.scope === "owner";
  const requestedTargetId = input.targetProfessionalId?.trim() || input.viewerProfessionalId;

  let targetId = input.viewerProfessionalId;

  if (requestedTargetId === input.viewerProfessionalId) {
    targetId = input.viewerProfessionalId;
  } else if (canManageTeam && teamEntries.some((entry) => entry.professional.id === requestedTargetId)) {
    targetId = requestedTargetId;
  } else if (input.strictTarget) {
    throw new Error("Access denied.");
  }

  const targetEntry = teamEntries.find((entry) => entry.professional.id === targetId);

  if (!targetEntry) {
    throw new Error("Specialist not found.");
  }

  return {
    viewerWorkspace,
    targetWorkspace: buildWorkspaceSnapshotFromDirectory(
      targetEntry.professional,
      targetEntry.membership,
      business,
      services,
      directory.businesses
    ),
    teamMembers: teamEntries.map((entry) => ({
      id: entry.professional.id,
      firstName: entry.professional.firstName,
      lastName: entry.professional.lastName,
      avatarUrl: entry.professional.avatarUrl,
      role: entry.membership.role,
      scope: entry.membership.scope === "owner" ? "owner" : "member",
      isViewer: entry.professional.id === input.viewerProfessionalId
    })),
    teamEntries,
    canManageTeam,
    businessDirectory: directory.businesses.map((item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt
    }))
  };
}

export async function getCalendarNotificationsContext(input: {
  professionalId: string;
}) {
  const access = await resolveCalendarAccess({
    viewerProfessionalId: input.professionalId
  });

  return {
    businessId: access.targetWorkspace.business.id,
    teamMembers: access.teamMembers
  };
}

export async function getCalendarDaySnapshot(input: {
  professionalId: string;
  appointmentDate: string;
  targetProfessionalId?: string;
}) {
  const access = await resolveCalendarAccess({
    viewerProfessionalId: input.professionalId,
    targetProfessionalId: input.targetProfessionalId
  });
  const professionalAppointments = await readAppointmentsForProfessional(access.targetWorkspace.professional.id);
  const businessAppointments = access.canManageTeam
    ? await getAppointmentsForBusiness(access.targetWorkspace.business.id)
    : professionalAppointments;
  const existing = professionalAppointments.filter(
    (appointment) => appointment.appointmentDate === input.appointmentDate
  );
  const weekRange = getWeekRange(input.appointmentDate);
  const monthRange = getMonthRange(input.appointmentDate);
  const clients = Array.from(
    new Map(
      professionalAppointments
        .filter(
          (appointment) =>
            appointment.customerName.trim() &&
            appointment.customerName.trim().toLowerCase() !== "клиент"
        )
        .map((appointment) => [
          `${appointment.customerName.trim().toLowerCase()}::${appointment.customerPhone.trim()}`,
          {
            name: appointment.customerName.trim(),
            phone: appointment.customerPhone.trim()
          }
        ])
    ).values()
  ).sort((left, right) => left.name.localeCompare(right.name, "ru"));

  const activitySource = access.canManageTeam
    ? businessAppointments
    : [...professionalAppointments].sort((left, right) =>
        `${right.createdAt}${right.appointmentDate}${right.startTime}`.localeCompare(
          `${left.createdAt}${left.appointmentDate}${left.startTime}`
        )
      );
  const teamMemberLabels = new Map(
    access.teamMembers.map((member) => [member.id, `${member.firstName} ${member.lastName}`.trim() || member.role])
  );
  const memberCalendars: CalendarMemberDaySnapshot[] = access.teamEntries
    .filter((entry) => access.canManageTeam || entry.professional.id === access.targetWorkspace.professional.id)
    .map((entry) => {
      const memberWorkspace = buildWorkspaceSnapshotFromDirectory(
        entry.professional,
        entry.membership,
        access.targetWorkspace.business,
        access.targetWorkspace.services,
        access.businessDirectory
      );

      return {
        professionalId: entry.professional.id,
        firstName: entry.professional.firstName,
        lastName: entry.professional.lastName,
        avatarUrl: entry.professional.avatarUrl,
        role: entry.membership.role,
        scope: entry.membership.scope === "owner" ? "owner" : "member",
        isViewer: entry.professional.id === input.professionalId,
        memberSchedule: memberWorkspace.memberSchedule,
        appointments: businessAppointments
          .filter(
            (appointment) =>
              appointment.professionalId === entry.professional.id &&
              appointment.appointmentDate === input.appointmentDate
          )
          .sort((left, right) => left.startTime.localeCompare(right.startTime))
      };
    });

  return {
    viewer: {
      id: access.viewerWorkspace.professional.id,
      firstName: access.viewerWorkspace.professional.firstName,
      lastName: access.viewerWorkspace.professional.lastName,
      avatarUrl: access.viewerWorkspace.professional.avatarUrl,
      role: access.viewerWorkspace.membership.role,
      scope: access.viewerWorkspace.membership.scope === "owner" ? "owner" : "member",
      language: access.viewerWorkspace.professional.language,
      country: access.viewerWorkspace.professional.country,
      currency: access.viewerWorkspace.professional.currency
    },
    teamMembers: access.teamMembers,
    viewedProfessionalId: access.targetWorkspace.professional.id,
    memberCalendars,
    workspace: access.targetWorkspace,
    appointments: existing.sort((left, right) => left.startTime.localeCompare(right.startTime)),
    clients,
    stats: {
      day: summarizeAppointments(professionalAppointments, input.appointmentDate, input.appointmentDate),
      week: summarizeAppointments(professionalAppointments, weekRange.start, weekRange.end),
      month: summarizeAppointments(professionalAppointments, monthRange.start, monthRange.end)
    },
    recentActivity: activitySource
      .filter((appointment) => appointment.kind === "appointment")
      .slice(0, 8)
      .map((appointment) => ({
        id: appointment.id,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        customerName: appointment.customerName,
        serviceName: appointment.serviceName,
        professionalId: appointment.professionalId,
        professionalName: teamMemberLabels.get(appointment.professionalId) || appointment.customerName || "Specialist",
        createdAt: appointment.createdAt
      }))
  };
}

async function prepareCalendarAppointmentWithWorkspace(input: {
  workspace: WorkspaceSnapshot;
  servicesCache?: ServiceRecord[];
  professionalId: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  notes: string;
  priceAmount?: number;
  attendance?: CalendarAttendanceStatus;
  allowMissingService?: boolean;
}) {
  const workspace = input.workspace;
  const availableServices = input.servicesCache ?? workspace.services;

  if (!input.startTime.trim()) {
    throw new Error("Start time is required.");
  }

  const serviceName = input.serviceName.trim();
  if (!serviceName) {
    throw new Error("Service name is required.");
  }

  const existingService = availableServices.find((item) => item.name === serviceName);
  const service =
    existingService ??
    (input.allowMissingService
      ? null
      : await ensureServiceForProfessional({
          professionalId: workspace.professional.id,
          serviceName
        }));

  if (
    service &&
    input.servicesCache &&
    !input.servicesCache.some((item) => item.id === service.id)
  ) {
    input.servicesCache.push(service);
  }

  const appointment: CalendarAppointment = {
    id: makeId("cal"),
    businessId: workspace.business.id,
    professionalId: workspace.professional.id,
    appointmentDate: input.appointmentDate,
    startTime: input.startTime,
    endTime:
      input.endTime ??
      addMinutes(
        input.startTime,
        getDefaultDuration(service?.name ?? serviceName, service ? [...workspace.services, service] : workspace.services)
      ),
    kind: "appointment",
    customerName: input.customerName.trim() || "Клиент",
    customerPhone: input.customerPhone.trim(),
    serviceName: service?.name ?? serviceName,
    notes: input.notes.trim(),
    attendance: input.attendance ?? "confirmed",
    priceAmount:
      typeof input.priceAmount === "number" && Number.isFinite(input.priceAmount)
        ? Math.max(0, input.priceAmount)
        : service?.price ?? 0,
    createdAt: new Date().toISOString()
  };

  return appointment;
}

async function createCalendarAppointmentWithWorkspace(input: {
  workspace: WorkspaceSnapshot;
  servicesCache?: ServiceRecord[];
  professionalId: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  notes: string;
  priceAmount?: number;
  attendance?: CalendarAttendanceStatus;
  allowMissingService?: boolean;
}) {
  const appointment = await prepareCalendarAppointmentWithWorkspace(input);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error } = await supabase.from("calendar_appointments").insert({
      id: appointment.id,
      business_id: appointment.businessId,
      professional_id: appointment.professionalId,
      appointment_date: appointment.appointmentDate,
      start_time: appointment.startTime,
      end_time: appointment.endTime,
      kind: appointment.kind,
      customer_name: appointment.customerName,
      customer_phone: appointment.customerPhone,
      service_name: appointment.serviceName,
      notes: appointment.notes,
      attendance: appointment.attendance,
      price_amount: appointment.priceAmount,
      created_at: appointment.createdAt
    });

    if (error) {
      throw new Error(error.message);
    }

    return appointment;
  }

  const store = await readStore();
  store.appointments.push(appointment);
  await writeStore(store);

  return appointment;
}

export async function createCalendarAppointmentsBatch(input: {
  professionalId: string;
  targetProfessionalId?: string;
  items: Array<{
    appointmentDate: string;
    startTime: string;
    endTime?: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    notes: string;
    priceAmount?: number;
    attendance?: CalendarAttendanceStatus;
    allowMissingService?: boolean;
  }>;
}) {
  if (!input.items.length) {
    return [];
  }

  const access = await resolveCalendarAccess({
    viewerProfessionalId: input.professionalId,
    targetProfessionalId: input.targetProfessionalId,
    strictTarget: true
  });
  const workspace = access.targetWorkspace;
  const servicesCache = [...workspace.services];
  const created: CalendarAppointment[] = [];

  for (const item of input.items) {
    created.push(
      await prepareCalendarAppointmentWithWorkspace({
        workspace,
        servicesCache,
        professionalId: input.professionalId,
        appointmentDate: item.appointmentDate,
        startTime: item.startTime,
        endTime: item.endTime,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        serviceName: item.serviceName,
        notes: item.notes,
        priceAmount: item.priceAmount,
        attendance: item.attendance,
        allowMissingService: item.allowMissingService
      })
    );
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error } = await supabase.from("calendar_appointments").insert(
      created.map((appointment) => ({
        id: appointment.id,
        business_id: appointment.businessId,
        professional_id: appointment.professionalId,
        appointment_date: appointment.appointmentDate,
        start_time: appointment.startTime,
        end_time: appointment.endTime,
        kind: appointment.kind,
        customer_name: appointment.customerName,
        customer_phone: appointment.customerPhone,
        service_name: appointment.serviceName,
        notes: appointment.notes,
        attendance: appointment.attendance,
        price_amount: appointment.priceAmount,
        created_at: appointment.createdAt
      }))
    );

    if (error) {
      throw new Error(error.message);
    }

    return created;
  }

  const store = await readStore();
  store.appointments.push(...created);
  await writeStore(store);

  return created;
}

export async function createCalendarAppointment(input: {
  professionalId: string;
  targetProfessionalId?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  notes: string;
  priceAmount?: number;
  attendance?: CalendarAttendanceStatus;
  allowMissingService?: boolean;
}) {
  const [appointment] = await createCalendarAppointmentsBatch({
    professionalId: input.professionalId,
    targetProfessionalId: input.targetProfessionalId,
    items: [
      {
        appointmentDate: input.appointmentDate,
        startTime: input.startTime,
        endTime: input.endTime,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        serviceName: input.serviceName,
        notes: input.notes,
        priceAmount: input.priceAmount,
        attendance: input.attendance,
        allowMissingService: input.allowMissingService
      }
    ]
  });

  return appointment;
}

export async function getClientDirectory(professionalId: string): Promise<ClientDirectoryEntry[]> {
  const appointments = (await readAppointmentsForProfessional(professionalId)).filter(
    (appointment) =>
      appointment.kind === "appointment" &&
      appointment.attendance !== "pending" &&
      appointment.customerName.trim() &&
      appointment.customerName.trim().toLowerCase() !== "клиент"
  );

  const grouped = new Map<string, ClientDirectoryEntry>();

  for (const appointment of appointments) {
    const key = `${appointment.customerName.trim().toLowerCase()}::${appointment.customerPhone.trim()}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.visitsCount += 1;
      existing.totalSales += appointment.priceAmount || 0;
      if (new Date(appointment.createdAt).getTime() < new Date(existing.createdAt).getTime()) {
        existing.createdAt = appointment.createdAt;
      }
      continue;
    }

    grouped.set(key, {
      id: key,
      name: appointment.customerName.trim(),
      phone: appointment.customerPhone.trim(),
      visitsCount: 1,
      totalSales: appointment.priceAmount || 0,
      createdAt: appointment.createdAt
    });
  }

  return Array.from(grouped.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export async function getAppointmentUsageForProfessional(professionalId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return 0;
    }

    const { count, error } = await supabase
      .from("calendar_appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId)
      .eq("kind", "appointment");

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  const store = await readStore();

  return store.appointments.filter(
    (appointment) => appointment.professionalId === professionalId && appointment.kind === "appointment"
  ).length;
}

export async function updateCalendarAppointmentTime(input: {
  professionalId: string;
  targetProfessionalId?: string;
  appointmentId: string;
  startTime: string;
  endTime?: string;
}) {
  const access = await resolveCalendarAccess({
    viewerProfessionalId: input.professionalId,
    targetProfessionalId: input.targetProfessionalId,
    strictTarget: true
  });
  const targetProfessionalId = access.targetWorkspace.professional.id;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { data: existing, error: existingError } = await supabase
      .from("calendar_appointments")
      .select(
        "id, business_id, professional_id, appointment_date, start_time, end_time, kind, customer_name, customer_phone, service_name, notes, attendance, price_amount, created_at"
      )
      .eq("id", input.appointmentId)
      .eq("professional_id", targetProfessionalId)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (!existing) {
      throw new Error("Appointment not found.");
    }

    const duration = timeToDurationMinutes(existing.start_time, existing.end_time);
    const nextEndTime = input.endTime ?? addMinutes(input.startTime, duration);
    const { data, error } = await supabase
      .from("calendar_appointments")
      .update({
        start_time: input.startTime,
        end_time: nextEndTime
      })
      .eq("id", input.appointmentId)
      .eq("professional_id", targetProfessionalId)
      .select(
        "id, business_id, professional_id, appointment_date, start_time, end_time, kind, customer_name, customer_phone, service_name, notes, attendance, price_amount, created_at"
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Appointment not found.");
    }

    return mapSupabaseAppointment(data as CalendarAppointmentRow);
  }

  const store = await readStore();
  const appointment = store.appointments.find(
    (item) =>
      item.id === input.appointmentId && item.professionalId === targetProfessionalId
  );

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  const duration = timeToDurationMinutes(appointment.startTime, appointment.endTime);
  appointment.startTime = input.startTime;
  appointment.endTime = input.endTime ?? addMinutes(input.startTime, duration);

  await writeStore(store);
  return appointment;
}

export async function createBlockedCalendarTime(input: {
  professionalId: string;
  targetProfessionalId?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  serviceName?: string;
}) {
  const access = await resolveCalendarAccess({
    viewerProfessionalId: input.professionalId,
    targetProfessionalId: input.targetProfessionalId,
    strictTarget: true
  });
  const workspace = access.targetWorkspace;

  const blocked: CalendarAppointment = {
    id: makeId("blk"),
    businessId: workspace.business.id,
    professionalId: workspace.professional.id,
    appointmentDate: input.appointmentDate,
    startTime: input.startTime,
    endTime: input.endTime,
    kind: "blocked",
    customerName: "",
    customerPhone: "",
    serviceName: input.serviceName?.trim() || "Забронированное время",
    notes: "",
    attendance: "pending",
    priceAmount: 0,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error } = await supabase.from("calendar_appointments").insert({
      id: blocked.id,
      business_id: blocked.businessId,
      professional_id: blocked.professionalId,
      appointment_date: blocked.appointmentDate,
      start_time: blocked.startTime,
      end_time: blocked.endTime,
      kind: blocked.kind,
      customer_name: blocked.customerName,
      customer_phone: blocked.customerPhone,
      service_name: blocked.serviceName,
      notes: blocked.notes,
      attendance: blocked.attendance,
      price_amount: blocked.priceAmount,
      created_at: blocked.createdAt
    });

    if (error) {
      throw new Error(error.message);
    }

    return blocked;
  }

  const store = await readStore();
  store.appointments.push(blocked);
  await writeStore(store);

  return blocked;
}

export async function deleteCalendarAppointment(input: {
  professionalId: string;
  targetProfessionalId?: string;
  appointmentId: string;
}) {
  const access = await resolveCalendarAccess({
    viewerProfessionalId: input.professionalId,
    targetProfessionalId: input.targetProfessionalId,
    strictTarget: true
  });
  const targetProfessionalId = access.targetWorkspace.professional.id;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { data, error } = await supabase
      .from("calendar_appointments")
      .delete()
      .eq("id", input.appointmentId)
      .eq("professional_id", targetProfessionalId)
      .select(
        "id, business_id, professional_id, appointment_date, start_time, end_time, kind, customer_name, customer_phone, service_name, notes, attendance, price_amount, created_at"
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Appointment not found.");
    }

    return mapSupabaseAppointment(data as CalendarAppointmentRow);
  }

  const store = await readStore();
  const deletedAppointment =
    store.appointments.find(
      (item) => item.id === input.appointmentId && item.professionalId === targetProfessionalId
    ) ?? null;
  store.appointments = store.appointments.filter(
    (item) => !(item.id === input.appointmentId && item.professionalId === targetProfessionalId)
  );

  if (!deletedAppointment) {
    throw new Error("Appointment not found.");
  }

  await writeStore(store);
  return deletedAppointment;
}

export async function updateCalendarAppointmentMeta(input: {
  professionalId: string;
  targetProfessionalId?: string;
  appointmentId: string;
  attendance: CalendarAttendanceStatus;
  priceAmount: number;
  customerName?: string;
  customerPhone?: string;
  startTime?: string;
  endTime?: string;
  serviceName?: string;
  notes?: string;
}) {
  const access = await resolveCalendarAccess({
    viewerProfessionalId: input.professionalId,
    targetProfessionalId: input.targetProfessionalId,
    strictTarget: true
  });
  const targetProfessionalId = access.targetWorkspace.professional.id;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const updatePayload: Record<string, string | number> = {
      attendance: input.attendance,
      price_amount: Math.max(0, Number.isFinite(input.priceAmount) ? input.priceAmount : 0)
    };

    if (typeof input.customerName === "string") {
      updatePayload.customer_name = input.customerName.trim();
    }

    if (typeof input.customerPhone === "string") {
      updatePayload.customer_phone = input.customerPhone.trim();
    }

    if (typeof input.startTime === "string" && input.startTime.trim()) {
      updatePayload.start_time = input.startTime.trim();
    }

    if (typeof input.endTime === "string" && input.endTime.trim()) {
      updatePayload.end_time = input.endTime.trim();
    }

    if (typeof input.serviceName === "string" && input.serviceName.trim()) {
      updatePayload.service_name = input.serviceName.trim();
    }

    if (typeof input.notes === "string") {
      updatePayload.notes = input.notes.trim();
    }

    const { data, error } = await supabase
      .from("calendar_appointments")
      .update(updatePayload)
      .eq("id", input.appointmentId)
      .eq("professional_id", targetProfessionalId)
      .select(
        "id, business_id, professional_id, appointment_date, start_time, end_time, kind, customer_name, customer_phone, service_name, notes, attendance, price_amount, created_at"
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Appointment not found.");
    }

    return mapSupabaseAppointment(data as CalendarAppointmentRow);
  }

  const store = await readStore();
  const appointment = store.appointments.find(
    (item) => item.id === input.appointmentId && item.professionalId === targetProfessionalId
  );

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  appointment.attendance = input.attendance;
  appointment.priceAmount = Math.max(0, Number.isFinite(input.priceAmount) ? input.priceAmount : 0);
  if (typeof input.customerName === "string") {
    appointment.customerName = input.customerName.trim();
  }
  if (typeof input.customerPhone === "string") {
    appointment.customerPhone = input.customerPhone.trim();
  }
  if (typeof input.startTime === "string" && input.startTime.trim()) {
    appointment.startTime = input.startTime.trim();
  }
  if (typeof input.endTime === "string" && input.endTime.trim()) {
    appointment.endTime = input.endTime.trim();
  }
  if (typeof input.serviceName === "string" && input.serviceName.trim()) {
    appointment.serviceName = input.serviceName.trim();
  }
  if (typeof input.notes === "string") {
    appointment.notes = input.notes.trim();
  }

  await writeStore(store);
  return appointment;
}

function timeToDurationMinutes(start: string, end: string) {
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}
