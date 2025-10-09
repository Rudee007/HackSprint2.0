// AvailabilityModal.jsx
import SlotButton from "./SlotButton";

function AvailabilityModal({ date, providerId, therapyType, onClose }) {
  const { data } = useQuery(
    ["slots", providerId, date, therapyType],
    () =>
      api.get(
        `/scheduling/providers/${providerId}/availability`,
        { params: { date, therapyType } }
      ),
    { enabled: !!date }
  );

  const refresh = () => queryClient.invalidateQueries(["slots", providerId, date, therapyType]);

  return (
    <Modal onClose={onClose}>
      <h3>Available slots • {date}</h3>

      {data?.data.slots.map((s) => (
        <SlotButton
          key={s.start}
          slot={s}
          providerId={providerId}
          therapyType={therapyType}
          onBooked={() => {
            refresh();
            onClose();           // or keep open if you want multiple bookings
          }}
        />
      ))}
    </Modal>
  );
}
