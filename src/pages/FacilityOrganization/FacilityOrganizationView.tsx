import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Pagination from "@/components/Common/Pagination";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

import CreateFacilityOrganizationSheet from "./components/CreateFacilityOrganizationSheet";
import FacilityOrganizationLayout from "./components/FacilityOrganizationLayout";

interface Props {
  id: string;
  facilityId: string;
}

export default function FacilityOrganizationView({ id, facilityId }: Props) {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 12; // 3x4 grid

  const { data: children, isLoading } = useQuery({
    queryKey: [
      "facilityOrganization",
      "list",
      facilityId,
      id,
      page,
      limit,
      searchQuery,
    ],
    queryFn: query.debounced(routes.facilityOrganization.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: id,
        offset: (page - 1) * limit,
        limit,
        name: searchQuery || undefined,
      },
    }),
  });

  return (
    <FacilityOrganizationLayout id={id} facilityId={facilityId}>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between item-start lg:items-center  gap-4">
          <h2 className="text-lg font-semibold">{t("organizations")}</h2>
          <div className="flex flex-col items-center md:flex-row sm:items-center gap-4 w-full lg:justify-end">
            <div className="w-full lg:w-1/3">
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="w-full"
              />
            </div>
            <div className="w-auto">
              <CreateFacilityOrganizationSheet
                facilityId={facilityId}
                parentId={id}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardGridSkeleton count={6} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children?.results?.length ? (
                children.results.map((org) => (
                  <Card key={org.id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap">
                          <div className="space-y-1 mb-2">
                            <h3 className="text-lg font-semibold">
                              {org.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{org.org_type}</Badge>
                              <Badge variant="outline">{org.org_type}</Badge>
                            </div>
                          </div>
                          <Button variant="link" asChild>
                            <Link
                              href={`/facility/${facilityId}/organization/${org.id}`}
                            >
                              {t("view_details")}
                              <CareIcon
                                icon="l-arrow-right"
                                className="h-4 w-4"
                              />
                            </Link>
                          </Button>
                        </div>
                        {org.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {org.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    {searchQuery
                      ? t("no_organizations_found")
                      : t("no_sub_organizations_found")}
                  </CardContent>
                </Card>
              )}
            </div>
            {children && children.count > limit && (
              <div className="flex justify-center">
                <Pagination
                  data={{ totalCount: children.count }}
                  onChange={(page, _) => setPage(page)}
                  defaultPerPage={limit}
                  cPage={page}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </FacilityOrganizationLayout>
  );
}
