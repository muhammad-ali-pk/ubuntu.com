import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Field, useFormikContext } from "formik";
import {
  ActionButton,
  Col,
  Input,
  RadioInput,
  Row,
} from "@canonical/react-components";
import { CardElement } from "@stripe/react-stripe-js";
import {
  getNotificationMessage,
  getCardErrorMessage,
} from "../../utils/translateErrors";
import registerPaymentMethod from "../../hooks/postCustomerInfo";
import type {
  DisplayError,
  FormValues,
  ValidationError,
} from "../../utils/types";
import FormRow from "../FormRow";
import PaymentMethodSummary from "./PaymentMethodSummary";
import { UserSubscriptionMarketplace } from "advantage/api/enum";

type Props = {
  setError: React.Dispatch<React.SetStateAction<DisplayError | null>>;
  isCardSaving: boolean;
  setIsCardSaving: React.Dispatch<React.SetStateAction<boolean>>;
};

const UserInfoForm = ({ setError, isCardSaving, setIsCardSaving }: Props) => {
  const {
    errors,
    touched,
    values,
    initialValues,
    setFieldTouched,
    setFieldValue,
  } = useFormikContext<FormValues>();
  const queryClient = useQueryClient();
  const paymentMethodMutation = registerPaymentMethod();
  const isNewUser = !window.accountId || !initialValues.defaultPaymentMethod;
  const [isEditing, setIsEditing] = useState(isNewUser);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [cardFieldHasFocus, setCardFieldFocus] = useState(false);
  const [cardFieldError, setCardFieldError] = useState<ValidationError | null>(
    null,
  );
  const [showCardValidation, setShowCardValidation] = useState<boolean>(false);
  const isChannelUser =
    values.marketplace === UserSubscriptionMarketplace.CanonicalProChannel;

  const toggleEditing = () => {
    if (isEditing) {
      onSaveClick();
    } else {
      setIsEditing(true);
      setFieldValue("isInfoSaved", false);
    }
  };

  useEffect(() => {
    setFieldValue("isCardValid", !isEditing);
  }, [isEditing]);

  useEffect(() => {
    if (!initialValues.email || !window.accountId) {
      setFieldValue("isInfoSaved", true);
    }
  }, []);
  const validationElement: HTMLElement = document?.querySelector("#isCardValid")
    ?.nextElementSibling as HTMLElement;
  if (validationElement) {
    validationElement.style.marginTop = "0.8rem";
  }
  useEffect(() => {
    if (!values.isCardValid && cardFieldError === null) {
      setShowCardValidation(true);
    } else {
      setShowCardValidation(false);
    }
  }, [values.isCardValid, cardFieldError, cardFieldHasFocus]);

  const onSaveClick = () => {
    setFieldTouched("isInfoSaved", false);
    setIsButtonDisabled(true);
    setFieldValue("isInfoSaved", true);
    setIsCardSaving(true);

    paymentMethodMutation.mutate(
      { formData: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["customerInfo"] });
          queryClient.invalidateQueries({ queryKey: ["preview"] });
          setIsButtonDisabled(false);
          setIsEditing(false);
          setIsCardSaving(false);
        },
        onError: (error) => {
          setFieldValue("Description", false);
          setFieldValue("TermsAndConditions", false);
          setIsButtonDisabled(false);
          setIsCardSaving(false);
          document.querySelector("h1")?.scrollIntoView();

          if (error instanceof Error) {
            const knownErrorMessage = getNotificationMessage(error);
            setError(knownErrorMessage);
          }
        },
      },
    );
  };

  const validateRequired = (value: string) => {
    let errorMessage;
    if (!value) {
      errorMessage = "This field is required.";
    }
    return errorMessage;
  };

  const validateOrganisationName = (value: string) => {
    let errorMessage;
    if (!value && values.buyingFor === "organisation") {
      errorMessage = "This field is required.";
    } else if (
      values.buyingFor === "organisation" &&
      values.organisationName === values.name
    ) {
      errorMessage = 'Please select "I\'m buying for: Myself" option above.';
    }
    return errorMessage;
  };

  const UserInfoSummary = () => (
    <>
      {values.buyingFor === "organisation" && (
        <>
          <Row>
            <Col size={4}>
              <p>Organisation:</p>
            </Col>
            <Col size={8}>
              <p>
                <strong data-testid="organisation-name">
                  {values.organisationName}
                </strong>
              </p>
            </Col>
          </Row>
          <hr />
        </>
      )}
      <Row>
        <Col size={4}>
          <p>Your name:</p>
        </Col>
        <Col size={8}>
          <p>
            <strong data-testid="customer-name">{values.name}</strong>
          </p>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col size={4}>
          <p>Billing address:</p>
        </Col>
        <Col size={8}>
          <p>
            <strong data-testid="customer-address">{values.address}</strong>
          </p>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col size={4}>
          <p>City:</p>
        </Col>
        <Col size={8}>
          <p>
            <strong data-testid="customer-city">{values.city}</strong>
          </p>
        </Col>
      </Row>
      <hr />
      <Row>
        <Col size={4}>
          <p>Postal code:</p>
        </Col>
        <Col size={8}>
          <p>
            <strong data-testid="customer-postal-code">
              {values.postalCode}
            </strong>
          </p>
        </Col>
      </Row>
    </>
  );

  const displayMode = (
    <>
      <PaymentMethodSummary />
      <UserInfoSummary />
    </>
  );

  const editMode = (
    <>
      <FormRow
        label="Payment card:"
        error={getCardErrorMessage(cardFieldError)}
      >
        <div
          id="card-element"
          className={`${cardFieldHasFocus ? "StripeElement--focus" : ""} ${
            cardFieldError || (validationElement && showCardValidation)
              ? "StripeElement--invalid"
              : ""
          }`}
        >
          <CardElement
            options={{
              style: {
                base: {
                  iconColor: "#e95420",
                  color: "#111",
                  fontWeight: 300,
                  fontFamily:
                    '"Ubuntu", -apple-system, "Segoe UI", "Roboto", "Oxygen", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                  fontSmoothing: "antialiased",
                  fontSize: "16px",
                  lineHeight: "24px",
                  "::placeholder": {
                    color: "#000",
                  },
                  ":-webkit-autofill": {
                    color: "#000",
                  },
                },
              },
            }}
            onFocus={() => {
              setCardFieldFocus(true);
            }}
            onBlur={() => {
              setCardFieldFocus(false);
            }}
            onChange={(e) => {
              setShowCardValidation(false);
              if (e.complete && !e.error) {
                setFieldValue("isCardValid", true);
                setCardFieldError(null);
              } else {
                setFieldValue("isCardValid", false);
                if (e.error) {
                  setCardFieldError(e.error);
                }
              }
            }}
          />
        </div>
        <Field
          as={Input}
          type="hidden"
          id="isCardValid"
          name="isCardValid"
          validate={() => {
            if (showCardValidation) {
              return "This field is required.";
            }
            return;
          }}
          required
          error={touched?.isCardValid && errors?.isCardValid}
          data-testid="field-card-number"
        />
      </FormRow>
      {isChannelUser && !isNewUser ? (
        <UserInfoSummary />
      ) : (
        <>
          <Field
            data-testid="field-customer-name"
            as={Input}
            type="text"
            id="name"
            name="name"
            label="Name:"
            stacked
            validate={validateRequired}
            error={touched?.name && errors?.name}
          />
          <FormRow label="I'm buying for:">
            <div className="u-sv3 p-form p-form--inline" role="group">
              <Field name="buyingFor">
                {({ field }: any) => (
                  <>
                    <RadioInput
                      {...field}
                      id="myself"
                      value="myself"
                      checked={field.value === "myself"}
                      onChange={() => setFieldValue("buyingFor", "myself")}
                      label="Myself"
                      disabled={
                        window.accountId && initialValues.organisationName
                      }
                    />
                    <RadioInput
                      {...field}
                      id="organisation"
                      value="organisation"
                      checked={field.value === "organisation"}
                      onChange={() =>
                        setFieldValue("buyingFor", "organisation")
                      }
                      label="An organisation"
                      disabled={
                        window.accountId && initialValues.organisationName
                      }
                    />
                  </>
                )}
              </Field>
            </div>
          </FormRow>
          {initialValues.buyingFor === "myself" &&
          window.accountId &&
          initialValues.organisationName ? null : (
            <Field
              data-testid="field-org-name"
              as={Input}
              type="text"
              id="organisationName"
              name="organisationName"
              disabled={
                values.buyingFor === "myself" ||
                (window.accountId && initialValues.organisationName)
              }
              label="Organisation:"
              stacked
              validate={validateOrganisationName}
              error={
                values.buyingFor === "organisation" &&
                touched?.organisationName &&
                errors?.organisationName
              }
            />
          )}
          <Field
            data-testid="field-address"
            as={Input}
            type="text"
            id="address"
            name="address"
            label="Address:"
            stacked
            validate={validateRequired}
            error={touched?.address && errors?.address}
          />
          <Field
            data-testid="field-city"
            as={Input}
            type="text"
            id="city"
            name="city"
            label="City:"
            stacked
            validate={validateRequired}
            error={touched?.city && errors?.city}
          />
          <Field
            data-testid="field-post-code"
            as={Input}
            type="text"
            id="postalCode"
            name="postalCode"
            label="Postal code:"
            stacked
            validate={validateRequired}
            error={touched?.postalCode && errors?.postalCode}
          />
        </>
      )}
      <p>
        We will save your card information. You can change it in your Ubuntu
        account{" "}
      </p>
    </>
  );

  return (
    <Row>
      {isEditing ? editMode : displayMode}
      {window.accountId && initialValues.defaultPaymentMethod && (
        <>
          <Col size={4}></Col>
          <Col size={8}>
            <Field
              as={Input}
              type="hidden"
              id="isInfoSaved"
              name="isInfoSaved"
              validate={(value: string) => {
                if (!value) {
                  return "Step needs to be saved.";
                }
                return;
              }}
              required
              error={touched?.isInfoSaved && errors?.isInfoSaved}
            />
          </Col>
          <hr />
          <div
            className="u-align--right"
            style={{ marginTop: "calc(.5rem - 1.5px)" }}
          >
            {isEditing && (
              <ActionButton
                onClick={() => {
                  setFieldValue("buyingFor", initialValues.buyingFor);
                  setFieldValue(
                    "organisationName",
                    initialValues.organisationName,
                  );
                  setFieldValue("name", initialValues.name);
                  setFieldValue("address", initialValues.address);
                  setFieldValue("city", initialValues.city);
                  setFieldValue("postalCode", initialValues.postalCode);
                  setIsEditing(false);
                  setFieldValue("isInfoSaved", true);
                  setFieldTouched("isInfoSaved", false);
                }}
              >
                Cancel
              </ActionButton>
            )}
            <ActionButton
              onClick={toggleEditing}
              loading={isCardSaving}
              disabled={isButtonDisabled}
              data-testid="user-info-save-button"
            >
              {isEditing ? "Save" : "Edit"}
            </ActionButton>
          </div>
        </>
      )}
    </Row>
  );
};

export default UserInfoForm;
