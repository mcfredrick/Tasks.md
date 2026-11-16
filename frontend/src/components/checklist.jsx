import { createSignal, For, Show } from "solid-js";
import { DragAndDrop } from "./drag-and-drop";

const maxStarsShown = 10;

/**
 * Flat checklist over the board: every card outside the done lane is an open
 * item, and done-lane cards are completed items.
 *
 * @param {Object} props
 * @param {Object[]} props.openItems Cards outside the done lane, in display order
 * @param {Object[]} props.completedItems Cards in the done lane
 * @param {boolean} props.disableDrag True while sorting or searching, when the
 *   displayed order is not the stored order
 * @param {(card: Object, isDone: boolean) => void} props.onToggle
 * @param {(name: string) => void} props.onAdd
 * @param {(card: Object, newName: string) => void} props.onRename
 * @param {(card: Object) => void} props.onDelete
 * @param {(card: Object, index: number) => void} props.onReorder Index within openItems
 * @param {(name: string, ignoredName?: string) => string|null} props.validateName
 * @param {Function} props.t
 */
export function Checklist(props) {
  const [newItemName, setNewItemName] = createSignal("");
  const [addError, setAddError] = createSignal(null);
  const [editingName, setEditingName] = createSignal(null);
  const [editValue, setEditValue] = createSignal("");
  const [completedOpen, setCompletedOpen] = createSignal(true);

  function addItem(e) {
    e.preventDefault();
    const name = newItemName().trim();
    if (!name) {
      return;
    }
    const error = props.validateName(name);
    setAddError(error);
    if (error) {
      return;
    }
    props.onAdd(name);
    setNewItemName("");
  }

  function startEditing(card) {
    setEditValue(card.name);
    setEditingName(card.name);
  }

  function finishEditing(card) {
    if (editingName() !== card.name) {
      return;
    }
    const name = editValue().trim();
    setEditingName(null);
    if (name && name !== card.name && !props.validateName(name, card.name)) {
      props.onRename(card, name);
    }
  }

  function handleEditKeyDown(e, card) {
    if (e.key === "Enter") {
      e.preventDefault();
      finishEditing(card);
    }
    if (e.key === "Escape") {
      setEditingName(null);
    }
  }

  function handleReorder({ id, index }) {
    const card = props.openItems.find((item) => `card-${item.name}` === id);
    props.onReorder(card, index);
  }

  const stars = () => "★".repeat(Math.min(props.completedItems.length, maxStarsShown));
  const extraStars = () => Math.max(props.completedItems.length - maxStarsShown, 0);

  function itemRow(card, isDone) {
    const isEditing = () => editingName() === card.name;
    return (
      <li
        id={`card-${card.name}`}
        class="checklist__item"
        classList={{ "checklist__item--done": isDone }}
      >
        <input
          type="checkbox"
          class="checklist__checkbox"
          checked={isDone}
          aria-label={card.name}
          onChange={(e) => props.onToggle(card, e.target.checked)}
        />
        <Show
          when={isEditing()}
          fallback={
            <span
              class="checklist__name"
              onClick={() => !isDone && startEditing(card)}
            >
              {card.name}
            </span>
          }
        >
          <input
            type="text"
            class="checklist__edit"
            value={editValue()}
            ref={(el) => setTimeout(() => el.focus())}
            onInput={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => handleEditKeyDown(e, card)}
            onBlur={() => finishEditing(card)}
          />
          <button
            type="button"
            class="checklist__delete"
            aria-label={props.t()("cardName.delete")}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setEditingName(null);
              props.onDelete(card);
            }}
          >
            ✕
          </button>
        </Show>
        <Show when={!isDone && !isEditing() && !props.disableDrag}>
          <span class="checklist__grip" aria-hidden="true">⋮⋮</span>
        </Show>
      </li>
    );
  }

  return (
    <main class="checklist">
      <section class="checklist__section">
        <Show
          when={!props.disableDrag}
          fallback={
            <ul class="checklist__items">
              <For each={props.openItems}>{(card) => itemRow(card, false)}</For>
            </ul>
          }
        >
          <DragAndDrop.Provider>
            <DragAndDrop.Container
              class="checklist__items"
              id="checklist-open"
              group="checklist"
              onChange={handleReorder}
            >
              <For each={props.openItems}>{(card) => itemRow(card, false)}</For>
            </DragAndDrop.Container>
            <DragAndDrop.Target />
          </DragAndDrop.Provider>
        </Show>
        <form class="checklist__add" onSubmit={addItem}>
          <span class="checklist__add-icon" aria-hidden="true">+</span>
          <input
            type="text"
            class="checklist__add-input"
            placeholder={props.t()("checklist.addPlaceholder")}
            value={newItemName()}
            onInput={(e) => {
              setNewItemName(e.target.value);
              setAddError(null);
            }}
            enterkeyhint="done"
          />
        </form>
        <Show when={addError()}>
          <p class="checklist__error">{addError()}</p>
        </Show>
      </section>

      <Show when={props.completedItems.length}>
        <section class="checklist__section checklist__section--completed">
          <button
            type="button"
            class="checklist__completed-toggle"
            aria-expanded={completedOpen()}
            onClick={() => setCompletedOpen(!completedOpen())}
          >
            {completedOpen() ? "▾" : "▸"} {props.t()("checklist.completed")} ({props.completedItems.length})
          </button>
          <Show when={completedOpen()}>
            <ul class="checklist__items">
              <For each={props.completedItems}>{(card) => itemRow(card, true)}</For>
            </ul>
          </Show>
        </section>
      </Show>

      <footer class="checklist__footer">
        <span class="checklist__stars">{stars()}</span>
        <Show when={extraStars()}>
          <span class="checklist__stars-extra">+{extraStars()}</span>
        </Show>
        <span>
          {props.t()("checklist.starsCompleted", { count: props.completedItems.length })}
        </span>
      </footer>
    </main>
  );
}
