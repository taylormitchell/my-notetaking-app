
create table object (
    key text not null primary key,
    value text not null,
    created_at integer DEFAULT (CAST((julianday('now') - 2440587.5)*86400000 AS INTEGER)),
    updated_at integer DEFAULT (CAST((julianday('now') - 2440587.5)*86400000 AS INTEGER))
);

create trigger object_updated_at_trigger
after update on object
begin
    update object
    set updated_at = CAST((julianday('now') - 2440587.5)*86400000 AS INTEGER)
    where id = new.id;
end;
