import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { PhoneNumberValidator } from "@/components/Form/FieldValidators";
import OtpFormField from "@/components/Form/FormFields/OtpFormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";

import useAppHistory from "@/hooks/useAppHistory";

import { CarePatientTokenKey } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { parsePhoneNumber } from "@/Utils/utils";
import { TokenData } from "@/types/auth/otpToken";

export default function OTP({
  facilityId,
  staffUsername,
  page,
}: {
  facilityId: string;
  staffUsername: string;
  page: string;
}) {
  const { goBack } = useAppHistory();
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const validate = (phoneNumber: string) => {
    let errors = "";

    const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
    if (
      !parsedPhoneNumber ||
      !(PhoneNumberValidator(["mobile"])(parsedPhoneNumber ?? "") === undefined)
    ) {
      errors = t("invalid_phone");
    }
    return errors;
  };

  const { mutate: sendOTP } = useMutation({
    mutationFn: (phoneNumber: string) =>
      request(routes.otp.sendOtp, {
        body: {
          phone_number: phoneNumber,
        },
        silent: true,
      }),
    onSuccess: () => {
      if (page === "send") {
        const tokenData: TokenData = JSON.parse(
          localStorage.getItem(CarePatientTokenKey) || "{}",
        );
        if (
          Object.keys(tokenData).length > 0 &&
          tokenData.phoneNumber === phoneNumber &&
          dayjs(tokenData.createdAt).isAfter(dayjs().subtract(14, "minutes"))
        ) {
          Notification.Success({ msg: t("valid_otp_found") });
          navigate(
            `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
          );
        } else {
          navigate(
            `/facility/${facilityId}/appointments/${staffUsername}/otp/verify`,
          );
        }
      }
    },
    onError: () => {
      Notification.Error({
        msg: t("error_sending_otp"),
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validate(phoneNumber);
    if (errors !== "") {
      setError(errors);
      return;
    }
    sendOTP(phoneNumber);
  };

  const { mutate: verifyOTP } = useMutation({
    mutationFn: (otp: string) =>
      request(routes.otp.loginByOtp, {
        body: {
          phone_number: phoneNumber,
          otp: otp,
        },
      }),
    onSuccess: (response: any) => {
      const CarePatientToken = response.data?.access;
      if (CarePatientToken) {
        const tokenData: TokenData = {
          token: CarePatientToken,
          phoneNumber: phoneNumber,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(CarePatientTokenKey, JSON.stringify(tokenData));
      }
      navigate(
        `/facility/${facilityId}/appointments/${staffUsername}/book-appointment`,
      );
    },
    onError: () => {
      Notification.Error({
        msg: t("error_verifying_otp"),
      });
    },
  });

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    verifyOTP(otp);
  };

  const renderPhoneNumberForm = () => {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <span className="text-xl font-semibold">
          {t("enter_phone_number_to_login_register")}
        </span>
        <form
          onSubmit={handleSubmit}
          className="flex mt-2 flex-col gap-4 shadow border p-8 rounded-lg"
        >
          <div className="space-y-4">
            <PhoneNumberFormField
              name="phone_number"
              label={t("phone_number")}
              required
              types={["mobile"]}
              onChange={(e) => setPhoneNumber(e.value)}
              value={phoneNumber}
              error={error}
            />
          </div>
          <Button
            variant="primary"
            type="submit"
            className="w-full h-12 text-lg"
          >
            <span className="bg-gradient-to-b from-white/15 to-transparent"></span>
            {t("send_otp")}
          </Button>
        </form>
      </div>
    );
  };

  const renderVerifyForm = () => {
    return (
      <div className="mt-4 flex flex-col gap-1">
        <span className="text-xl font-semibold">
          {t("please_check_your_messages")}
        </span>
        <span className="text-sm">
          {t("we_ve_sent_you_a_code_to")}{" "}
          <span className="font-bold">{phoneNumber}</span>
        </span>
        <form
          onSubmit={handleVerifySubmit}
          className="flex mt-2 flex-col gap-4 shadow border p-8 rounded-lg"
        >
          <div className="flex flex-col space-y-4">
            <span className="text-xl self-center">
              {t("enter_the_verification_code")}
            </span>
            <OtpFormField
              name="otp"
              required
              onChange={(e) => setOtp(e.toString())}
              value={otp}
              error={error}
              length={5}
            />
          </div>
          <Button
            variant="primary_gradient"
            type="submit"
            className="w-full h-12 text-lg"
          >
            {t("verify_otp")}
          </Button>
          <a
            className="w-full text-sm underline text-center cursor-pointer text-secondary-800"
            onClick={() => sendOTP(phoneNumber)}
          >
            {t("didnt_receive_a_message")} {t("resend_otp")}
          </a>
        </form>
      </div>
    );
  };

  return (
    <div className="container max-w-3xl mx-auto p-10">
      <Button
        variant="outline"
        className="border border-secondary-400"
        onClick={() =>
          page === "send"
            ? goBack()
            : navigate(
                `/facility/${facilityId}/appointments/${staffUsername}/otp/send`,
              )
        }
      >
        <CareIcon icon="l-square-shape" className="h-4 w-4 mr-1" />
        <span className="text-sm underline">Back</span>
      </Button>
      {page === "send" ? renderPhoneNumberForm() : renderVerifyForm()}
    </div>
  );
}
