"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ProfileCard from "./ProfileCard";
import VerificationStatus from "./VerificationStatus";
import IdentityVerificationCard from "./IdentityVerificationCard";
import DriverLicenseCard from "./DriverLicenseCard";
import { getMyVerification, type UserVerificationDto } from "@/api-clients/verifications/verifications";
import {
  getMyDriverLicense,
  type DriverLicenseDto,
  type DriverLicenseVerificationState,
} from "@/api-clients/driver-license/driver-license";
import { logger } from "@/utils/logger";

interface VerificationSectionProps {
  readonly accessToken: string;
  readonly initialEmailVerified: boolean;
  readonly initialPhoneVerified: boolean;
  readonly initialLicenseVerified: boolean;
  readonly initialKycStatus: string;
}

type LoadState = "loading" | "ready" | "error";

function deriveLicenseState(
  license: DriverLicenseDto | null,
  initialLicenseVerified: boolean
): DriverLicenseVerificationState {
  if (!license) return initialLicenseVerified ? "Verified" : "NotSubmitted";
  if (license.verificationState) return license.verificationState;
  return license.isVerified ? "Verified" : "Pending";
}

export default function VerificationSection({
  accessToken,
  initialEmailVerified,
  initialPhoneVerified,
  initialLicenseVerified,
  initialKycStatus,
}: VerificationSectionProps) {
  // Identity state
  const [verificationState, setVerificationState] = useState<LoadState>("loading");
  const [verification, setVerification] = useState<UserVerificationDto | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const [identityModalOpen, setIdentityModalOpen] = useState(false);

  // License state
  const [licenseState, setLicenseState] = useState<LoadState>("loading");
  const [license, setLicense] = useState<DriverLicenseDto | null>(null);
  const [licenseError, setLicenseError] = useState("");
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  // Load identity verification
  const loadVerification = useCallback(async () => {
    setVerificationState("loading");
    setVerificationError("");
    try {
      const data = await getMyVerification(accessToken);
      setVerification(data);
      setVerificationState("ready");
    } catch (error) {
      logger.error("Failed to load verification status client-side", error);
      setVerificationError("Unable to load verification status.");
      setVerificationState("error");
    }
  }, [accessToken]);

  // Load driver license
  const loadLicense = useCallback(async () => {
    setLicenseState("loading");
    setLicenseError("");
    try {
      const data = await getMyDriverLicense(accessToken);
      setLicense(data);
      setLicenseState("ready");
    } catch (error) {
      logger.error("Failed to load driver license status client-side", error);
      setLicenseError("Unable to load driver license status.");
      setLicenseState("error");
    }
  }, [accessToken]);

  useEffect(() => {
    void loadVerification();
    void loadLicense();
  }, [loadVerification, loadLicense]);

  // Determine KYC status for summary card
  const kycStatus = useMemo(() => {
    if (verificationState === "loading") {
      return initialKycStatus;
    }
    return verification?.status ?? "NotVerified";
  }, [verificationState, verification, initialKycStatus]);

  // Determine license statuses for summary card
  const licenseStateEnum = useMemo(() => {
    if (licenseState === "loading") {
      return initialLicenseVerified ? "Verified" : "NotSubmitted";
    }
    return deriveLicenseState(license, initialLicenseVerified);
  }, [licenseState, license, initialLicenseVerified]);

  const licenseVerified = licenseStateEnum === "Verified";
  const licensePending = licenseStateEnum === "Pending";

  return (
    <>
      <ProfileCard>
        <VerificationStatus
          emailVerified={initialEmailVerified}
          phoneVerified={initialPhoneVerified}
          licenseVerified={licenseVerified}
          licensePending={licensePending}
          kycStatus={kycStatus}
          onVerifyIdentity={() => {
            setIdentityModalOpen(true);
          }}
          onUploadLicense={() => {
            setLicenseModalOpen(true);
          }}
        />
      </ProfileCard>

      <ProfileCard>
        <IdentityVerificationCard
          accessToken={accessToken}
          externalState={verificationState}
          externalVerification={verification}
          externalLoadError={verificationError}
          externalModalOpen={identityModalOpen}
          onOpenModal={() => {
            setIdentityModalOpen(true);
          }}
          onCloseModal={() => {
            setIdentityModalOpen(false);
          }}
          onSubmitted={next => {
            setVerification(next);
            setVerificationState("ready");
            setIdentityModalOpen(false);
          }}
        />
      </ProfileCard>

      <ProfileCard>
        <DriverLicenseCard
          accessToken={accessToken}
          externalState={licenseState}
          externalLicense={license}
          externalLoadError={licenseError}
          externalModalOpen={licenseModalOpen}
          onOpenModal={() => {
            setLicenseModalOpen(true);
          }}
          onCloseModal={() => {
            setLicenseModalOpen(false);
          }}
          onSubmitted={next => {
            setLicense(next);
            setLicenseState("ready");
            setLicenseModalOpen(false);
          }}
        />
      </ProfileCard>
    </>
  );
}
